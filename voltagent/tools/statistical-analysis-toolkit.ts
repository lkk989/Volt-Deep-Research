import {
    mean,
    median,
    mode,
    standardDeviation,
    sampleStandardDeviation,
    sampleVariance,
    sampleSkewness,
    sampleKurtosis,
    sampleCorrelation,
    sampleCovariance,
    linearRegression,
    linearRegressionLine,
    rSquared,
    quantile,
    interquartileRange,
    min,
    max,
    sum,
    zScore,
    tTest,
    tTestTwoSample,
    permutationTest,
    kMeansCluster,
    numericSort,
} from 'simple-statistics'
import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators'
import {
    createTool,
    type ToolExecuteOptions,
    type ToolHookOnEndArgs,
    type ToolHookOnStartArgs,
} from '@voltagent/core'
import { z } from 'zod'
import { voltlogger } from '../config/logger.js'

const ensureActive = (context?: ToolExecuteOptions) => {
    if (!context?.isActive) {
        throw new Error('Operation has been cancelled')
    }
}

const hooksFor = (name: string) => ({
    onStart: ({ tool, options }: ToolHookOnStartArgs) => {
        voltlogger.info(`${name}: start`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
        })
    },
    onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
        if (error) {
            voltlogger.error(`${name}: error`, {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                error: error instanceof Error ? error.message : String(error),
            })
            return undefined
        }
        voltlogger.info(`${name}: end`, {
            tool: tool.name,
            operationId: options?.operationId,
            toolCallId: options?.toolContext?.callId,
        })
        return undefined
    },
})

const round = (value: number, decimals = 6) =>
    Math.round(value * 10 ** decimals) / 10 ** decimals

export const descriptiveStatsTool = createTool({
    name: 'descriptive_statistics',
    description:
        'Compute comprehensive descriptive statistics for a numeric dataset. Returns count, mean, median, mode, standard deviation, variance, skewness, kurtosis, min, max, range, IQR, quartiles, and sum. Useful for exploratory data analysis, data profiling, and understanding distributions.',
    tags: [
        'statistics',
        'descriptive',
        'mean',
        'median',
        'standard-deviation',
        'distribution',
        'data-analysis',
        'EDA',
        'quantile',
    ],
    parameters: z.object({
        data: z
            .array(z.number())
            .min(1)
            .max(100000)
            .describe('Array of numeric values to analyze'),
    }),
    outputSchema: z.object({
        count: z.number(),
        mean: z.number(),
        median: z.number(),
        mode: z.number(),
        sum: z.number(),
        min: z.number(),
        max: z.number(),
        range: z.number(),
        standardDeviation: z.number(),
        sampleStandardDeviation: z.number(),
        sampleVariance: z.number(),
        skewness: z.number().nullable(),
        kurtosis: z.number().nullable(),
        q1: z.number(),
        q2: z.number(),
        q3: z.number(),
        iqr: z.number(),
        p5: z.number(),
        p95: z.number(),
    }),
    hooks: hooksFor('descriptive_statistics'),
    execute: async (args, context) => {
        ensureActive(context)

        const data = numericSort(args.data)
        const n = data.length
        const dataMin = min(data)
        const dataMax = max(data)

        let skew: number | null = null
        let kurt: number | null = null
        try {
            skew = n >= 3 ? round(sampleSkewness(data)) : null
        } catch {
            skew = null
        }
        try {
            kurt = n >= 4 ? round(sampleKurtosis(data)) : null
        } catch {
            kurt = null
        }

        return {
            count: n,
            mean: round(mean(data)),
            median: round(median(data)),
            mode: round(mode(data)),
            sum: round(sum(data)),
            min: dataMin,
            max: dataMax,
            range: round(dataMax - dataMin),
            standardDeviation: round(standardDeviation(data)),
            sampleStandardDeviation: round(sampleStandardDeviation(data)),
            sampleVariance: round(sampleVariance(data)),
            skewness: skew,
            kurtosis: kurt,
            q1: round(quantile(data, 0.25)),
            q2: round(quantile(data, 0.5)),
            q3: round(quantile(data, 0.75)),
            iqr: round(interquartileRange(data)),
            p5: round(quantile(data, 0.05)),
            p95: round(quantile(data, 0.95)),
        }
    },
})

export const correlationAnalysisTool = createTool({
    name: 'correlation_analysis',
    description:
        'Calculate the Pearson correlation coefficient and covariance between two numeric datasets. Returns r-value, covariance, and interpretation. Useful for determining the strength and direction of linear relationships between variables.',
    tags: [
        'statistics',
        'correlation',
        'pearson',
        'covariance',
        'relationship',
        'bivariate',
        'data-analysis',
    ],
    parameters: z.object({
        x: z
            .array(z.number())
            .min(3)
            .max(100000)
            .describe('First variable values'),
        y: z
            .array(z.number())
            .min(3)
            .max(100000)
            .describe('Second variable values (must match x in length)'),
    }),
    outputSchema: z.object({
        correlation: z.number(),
        covariance: z.number(),
        strength: z.string(),
        direction: z.string(),
        sampleSize: z.number(),
    }),
    hooks: hooksFor('correlation_analysis'),
    execute: async (args, context) => {
        ensureActive(context)

        if (args.x.length !== args.y.length) {
            throw new Error(
                `Datasets must have the same length. Got x=${args.x.length}, y=${args.y.length}`
            )
        }

        const r = round(sampleCorrelation(args.x, args.y))
        const cov = round(sampleCovariance(args.x, args.y))
        const absR = Math.abs(r)

        let strength: string
        if (absR >= 0.9) strength = 'very strong'
        else if (absR >= 0.7) strength = 'strong'
        else if (absR >= 0.5) strength = 'moderate'
        else if (absR >= 0.3) strength = 'weak'
        else strength = 'very weak / none'

        return {
            correlation: r,
            covariance: cov,
            strength,
            direction: r > 0 ? 'positive' : r < 0 ? 'negative' : 'none',
            sampleSize: args.x.length,
        }
    },
})

export const linearRegressionTool = createTool({
    name: 'linear_regression',
    description:
        'Perform simple linear regression on paired (x, y) data. Returns slope, intercept, R-squared, and predictions. Useful for modeling trends, forecasting, and understanding linear relationships in research data.',
    tags: [
        'statistics',
        'regression',
        'linear',
        'trend',
        'prediction',
        'forecasting',
        'r-squared',
        'slope',
    ],
    parameters: z.object({
        data: z
            .array(z.tuple([z.number(), z.number()]))
            .min(3)
            .max(100000)
            .describe('Array of [x, y] data points'),
        predictAt: z
            .array(z.number())
            .max(100)
            .optional()
            .describe('X values at which to predict Y'),
    }),
    outputSchema: z.object({
        slope: z.number(),
        intercept: z.number(),
        rSquared: z.number(),
        sampleSize: z.number(),
        predictions: z
            .array(z.object({ x: z.number(), predictedY: z.number() }))
            .optional(),
    }),
    hooks: hooksFor('linear_regression'),
    execute: async (args, context) => {
        ensureActive(context)

        const reg = linearRegression(args.data)
        const line = linearRegressionLine(reg)
        const r2 = round(rSquared(args.data, line))

        const predictions = args.predictAt?.map((x) => ({
            x,
            predictedY: round(line(x)),
        }))

        return {
            slope: round(reg.m),
            intercept: round(reg.b),
            rSquared: r2,
            sampleSize: args.data.length,
            predictions: predictions ?? undefined,
        }
    },
})

export const hypothesisTestTool = createTool({
    name: 'hypothesis_test',
    description:
        'Run statistical hypothesis tests: one-sample t-test, two-sample t-test, or permutation test. Returns test statistic and p-value. Useful for determining if observed differences are statistically significant.',
    tags: [
        'statistics',
        'hypothesis-test',
        't-test',
        'p-value',
        'significance',
        'permutation',
        'inference',
    ],
    parameters: z.object({
        test: z
            .enum(['one-sample-t', 'two-sample-t', 'permutation'])
            .describe('Type of hypothesis test to perform'),
        sampleA: z
            .array(z.number())
            .min(2)
            .max(100000)
            .describe('First sample data'),
        sampleB: z
            .array(z.number())
            .min(2)
            .max(100000)
            .optional()
            .describe(
                'Second sample data (required for two-sample and permutation tests)'
            ),
        expectedMean: z
            .number()
            .optional()
            .describe('Expected population mean (for one-sample t-test)'),
        alternative: z
            .enum(['two_side', 'greater', 'less'])
            .default('two_side')
            .describe(
                'Alternative hypothesis direction (for permutation test)'
            ),
        permutations: z
            .number()
            .int()
            .min(100)
            .max(100000)
            .default(10000)
            .describe('Number of permutations for permutation test'),
    }),
    outputSchema: z.object({
        test: z.string(),
        statistic: z.number().nullable(),
        pValue: z.number().nullable(),
        significant: z.boolean(),
        alpha: z.number(),
        sampleSizeA: z.number(),
        sampleSizeB: z.number().nullable(),
    }),
    hooks: hooksFor('hypothesis_test'),
    execute: async (args, context) => {
        ensureActive(context)
        const alpha = 0.05

        if (args.test === 'one-sample-t') {
            const stat = tTest(args.sampleA, args.expectedMean ?? 0)
            return {
                test: 'one-sample-t',
                statistic: round(stat),
                pValue: null,
                significant: Math.abs(stat) > 1.96,
                alpha,
                sampleSizeA: args.sampleA.length,
                sampleSizeB: null,
            }
        }

        if (args.test === 'two-sample-t') {
            if (!args.sampleB) {
                throw new Error('sampleB is required for two-sample t-test')
            }
            const stat = tTestTwoSample(args.sampleA, args.sampleB)
            const statValue = stat ?? null
            return {
                test: 'two-sample-t',
                statistic: statValue !== null ? round(statValue) : null,
                pValue: null,
                significant: statValue !== null && Math.abs(statValue) > 1.96,
                alpha,
                sampleSizeA: args.sampleA.length,
                sampleSizeB: args.sampleB.length,
            }
        }

        if (!args.sampleB) {
            throw new Error('sampleB is required for permutation test')
        }

        const pValue = permutationTest(
            args.sampleA,
            args.sampleB,
            args.alternative,
            args.permutations
        )

        return {
            test: 'permutation',
            statistic: null,
            pValue: round(pValue),
            significant: pValue < alpha,
            alpha,
            sampleSizeA: args.sampleA.length,
            sampleSizeB: args.sampleB.length,
        }
    },
})

export const zScoreAnalysisTool = createTool({
    name: 'z_score_analysis',
    description:
        'Compute z-scores for each value in a dataset to identify outliers and standardize data. Returns z-scores and flags values beyond a configurable threshold. Useful for anomaly detection, data normalization, and identifying extreme values.',
    tags: [
        'statistics',
        'z-score',
        'outlier-detection',
        'standardization',
        'anomaly',
        'normalization',
    ],
    parameters: z.object({
        data: z
            .array(z.number())
            .min(2)
            .max(100000)
            .describe('Array of numeric values'),
        threshold: z
            .number()
            .min(0.5)
            .max(5)
            .default(2)
            .describe('Z-score threshold for flagging outliers'),
    }),
    outputSchema: z.object({
        zScores: z.array(z.number()),
        outlierCount: z.number(),
        outlierIndices: z.array(z.number()),
        outlierValues: z.array(z.number()),
        dataMean: z.number(),
        dataStdDev: z.number(),
    }),
    hooks: hooksFor('z_score_analysis'),
    execute: async (args, context) => {
        ensureActive(context)

        const m = mean(args.data)
        const sd = standardDeviation(args.data)

        if (sd === 0) {
            return {
                zScores: args.data.map(() => 0),
                outlierCount: 0,
                outlierIndices: [],
                outlierValues: [],
                dataMean: round(m),
                dataStdDev: 0,
            }
        }

        const zScores = args.data.map((v) => round(zScore(v, m, sd)))
        const outlierIndices: number[] = []
        const outlierValues: number[] = []

        for (let i = 0; i < zScores.length; i++) {
            if (Math.abs(zScores[i]) > args.threshold) {
                outlierIndices.push(i)
                outlierValues.push(args.data[i])
            }
        }

        return {
            zScores,
            outlierCount: outlierIndices.length,
            outlierIndices,
            outlierValues,
            dataMean: round(m),
            dataStdDev: round(sd),
        }
    },
})

export const kMeansClusteringTool = createTool({
    name: 'k_means_clustering',
    description:
        'Perform k-means clustering on multi-dimensional numeric data. Groups data points into k clusters and returns cluster labels and centroids. Useful for pattern discovery, market segmentation, and data categorization in research.',
    tags: [
        'statistics',
        'clustering',
        'k-means',
        'unsupervised',
        'pattern-discovery',
        'segmentation',
        'machine-learning',
    ],
    parameters: z.object({
        data: z
            .array(z.array(z.number()))
            .min(2)
            .max(50000)
            .describe(
                'Array of data points (each point is an array of numeric features)'
            ),
        k: z.number().int().min(2).max(20).describe('Number of clusters'),
    }),
    outputSchema: z.object({
        labels: z.array(z.number()),
        centroids: z.array(z.array(z.number())),
        clusterSizes: z.array(z.number()),
        k: z.number(),
        totalPoints: z.number(),
    }),
    hooks: hooksFor('k_means_clustering'),
    execute: async (args, context) => {
        ensureActive(context)

        if (args.k > args.data.length) {
            throw new Error(
                `k (${args.k}) cannot exceed data length (${args.data.length})`
            )
        }

        const result = kMeansCluster(args.data, args.k)

        const clusterSizes = new Array<number>(args.k).fill(0)
        for (const label of result.labels) {
            clusterSizes[label]++
        }

        return {
            labels: result.labels,
            centroids: result.centroids.map((c) => c.map((v) => round(v))),
            clusterSizes,
            k: args.k,
            totalPoints: args.data.length,
        }
    },
})

export const calculateSmaTool = createTool({
    name: 'calculate_sma',
    description:
        'Calculate Simple Moving Average (SMA) for a list of values. Useful for smoothing time-series data and identifying trends.',
    tags: ['technical-indicator', 'sma', 'moving-average', 'trend', 'finance'],
    parameters: z.object({
        values: z.array(z.number()).min(2).describe('Array of data values'),
        period: z.number().int().min(2).default(14).describe('Period for SMA'),
    }),
    outputSchema: z.object({
        sma: z.array(z.number()),
    }),
    hooks: hooksFor('calculate_sma'),
    execute: async (args, context) => {
        ensureActive(context)
        const result = SMA.calculate({
            values: args.values,
            period: args.period,
        })
        return { sma: result }
    },
})

export const calculateEmaTool = createTool({
    name: 'calculate_ema',
    description:
        'Calculate Exponential Moving Average (EMA) for a list of values. Gives more weight to recent prices. Useful for trend identification with faster reaction than SMA.',
    tags: ['technical-indicator', 'ema', 'moving-average', 'trend', 'finance'],
    parameters: z.object({
        values: z.array(z.number()).min(2).describe('Array of data values'),
        period: z.number().int().min(2).default(14).describe('Period for EMA'),
    }),
    outputSchema: z.object({
        ema: z.array(z.number()),
    }),
    hooks: hooksFor('calculate_ema'),
    execute: async (args, context) => {
        ensureActive(context)
        const result = EMA.calculate({
            values: args.values,
            period: args.period,
        })
        return { ema: result }
    },
})

export const calculateRsiTool = createTool({
    name: 'calculate_rsi',
    description:
        'Calculate Relative Strength Index (RSI). Measures the speed and change of price movements. Useful for identifying overbought or oversold conditions.',
    tags: ['technical-indicator', 'rsi', 'momentum', 'oscillator', 'finance'],
    parameters: z.object({
        values: z.array(z.number()).min(2).describe('Array of data values'),
        period: z.number().int().min(2).default(14).describe('Period for RSI'),
    }),
    outputSchema: z.object({
        rsi: z.array(z.number()),
    }),
    hooks: hooksFor('calculate_rsi'),
    execute: async (args, context) => {
        ensureActive(context)
        const result = RSI.calculate({
            values: args.values,
            period: args.period,
        })
        return { rsi: result }
    },
})

export const calculateMacdTool = createTool({
    name: 'calculate_macd',
    description:
        'Calculate Moving Average Convergence Divergence (MACD). A trend-following momentum indicator. Returns MACD line, signal line, and histogram.',
    tags: ['technical-indicator', 'macd', 'momentum', 'trend', 'oscillator'],
    parameters: z.object({
        values: z.array(z.number()).min(2).describe('Array of data values'),
        fastPeriod: z
            .number()
            .int()
            .min(2)
            .default(12)
            .describe('Fast period (usually 12)'),
        slowPeriod: z
            .number()
            .int()
            .min(2)
            .default(26)
            .describe('Slow period (usually 26)'),
        signalPeriod: z
            .number()
            .int()
            .min(2)
            .default(9)
            .describe('Signal period (usually 9)'),
    }),
    outputSchema: z.object({
        macd: z.array(
            z.object({
                MACD: z.number().optional(),
                signal: z.number().optional(),
                histogram: z.number().optional(),
            })
        ),
    }),
    hooks: hooksFor('calculate_macd'),
    execute: async (args, context) => {
        ensureActive(context)
        const result = MACD.calculate({
            values: args.values,
            fastPeriod: args.fastPeriod,
            slowPeriod: args.slowPeriod,
            signalPeriod: args.signalPeriod,
            SimpleMAOscillator: false,
            SimpleMASignal: false,
        })
        return { macd: result }
    },
})

export const calculateBollingerBandsTool = createTool({
    name: 'calculate_bollinger_bands',
    description:
        'Calculate Bollinger Bands. Returns upper, middle, and lower bands. Useful for measuring volatility and identifying potential overbought/oversold levels.',
    tags: [
        'technical-indicator',
        'bollinger-bands',
        'volatility',
        'bands',
        'finance',
    ],
    parameters: z.object({
        values: z.array(z.number()).min(2).describe('Array of data values'),
        period: z
            .number()
            .int()
            .min(2)
            .default(20)
            .describe('Period (usually 20)'),
        stdDev: z
            .number()
            .min(0.1)
            .default(2)
            .describe('Standard deviation multiplier (usually 2)'),
    }),
    outputSchema: z.object({
        bands: z.array(
            z.object({
                middle: z.number().optional(),
                upper: z.number().optional(),
                lower: z.number().optional(),
                pb: z.number().optional(),
            })
        ),
    }),
    hooks: hooksFor('calculate_bollinger_bands'),
    execute: async (args, context) => {
        ensureActive(context)
        const result = BollingerBands.calculate({
            values: args.values,
            period: args.period,
            stdDev: args.stdDev,
        })
        return { bands: result }
    },
})
