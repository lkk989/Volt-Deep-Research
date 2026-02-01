import {
    createTool,
    createToolkit,
    type Tool,
    type ToolHookOnEndArgs,
    type ToolHookOnStartArgs,
} from "@voltagent/core";
import { z } from "zod";

import {
    ADX,
    ATR,
    BollingerBands,
    EMA,
    MACD,
    RSI,
    SMA,
    Stochastic,
} from "technicalindicators";
import {
    linearRegression,
    linearRegressionLine,
    mean,
    median,
    quantile,
    rSquared,
    sampleCorrelation,
    sampleKurtosis,
    sampleSkewness,
    sampleStandardDeviation,
    sampleVariance,
} from "simple-statistics";

import { voltlogger } from "../config/logger.js";

const numberSeriesSchema = z.array(z.number().finite()).min(3).describe("Numeric series (length >= 3)");

export const calculateMovingAverageTool = createTool({
    name: "calculate_moving_average",
    description: "Calculate SMA or EMA values for a price series.",
    tags: ["finance", "technical-indicator"],
    parameters: z.object({
        values: numberSeriesSchema,
        period: z.number().int().min(2).describe("Moving average window length"),
        type: z.enum(["sma", "ema"]).default("sma"),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("calculate_moving_average: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("calculate_moving_average: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("calculate_moving_average: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ values, period, type }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        if (values.length < period) {
            throw new Error(`Price series length (${values.length}) must be >= period (${period}).`);
        }

        const computed = type === "ema" ? EMA.calculate({ period, values }) : SMA.calculate({ period, values });

        return {
            type,
            period,
            offset: period - 1,
            values: computed,
        };
    },
});

export const calculateRsiTool = createTool({
    name: "calculate_rsi",
    description: "Calculate Relative Strength Index (RSI) values for a price series.",
    tags: ["finance", "technical-indicator", "momentum"],
    parameters: z.object({
        values: numberSeriesSchema,
        period: z.number().int().min(2).describe("RSI lookback window"),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("calculate_rsi: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("calculate_rsi: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("calculate_rsi: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ values, period }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        if (values.length < period + 1) {
            throw new Error(`Price series length (${values.length}) must be >= period + 1 (${period + 1}).`);
        }

        return {
            period,
            offset: period,
            values: RSI.calculate({ period, values }),
        };
    },
});

export const calculateMacdTool = createTool({
    name: "calculate_macd",
    description: "Calculate MACD, signal, and histogram values for a price series.",
    tags: ["finance", "technical-indicator", "trend"],
    parameters: z.object({
        values: numberSeriesSchema,
        fastPeriod: z.number().int().min(2).default(12),
        slowPeriod: z.number().int().min(3).default(26),
        signalPeriod: z.number().int().min(2).default(9),
        oscillator: z.enum(["sma", "ema"]).default("ema"),
        signal: z.enum(["sma", "ema"]).default("ema"),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("calculate_macd: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("calculate_macd: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("calculate_macd: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ values, fastPeriod, slowPeriod, signalPeriod, oscillator, signal }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        if (fastPeriod >= slowPeriod) {
            throw new Error("fastPeriod must be less than slowPeriod.");
        }

        return {
            fastPeriod,
            slowPeriod,
            signalPeriod,
            values: MACD.calculate({
                values,
                fastPeriod,
                slowPeriod,
                signalPeriod,
                SimpleMAOscillator: oscillator === "sma",
                SimpleMASignal: signal === "sma",
            }).map((entry) => ({
                macd: entry.MACD ?? 0,
                signal: entry.signal ?? 0,
                histogram: entry.histogram ?? 0,
            })),
        };
    },
});

export const calculateBollingerBandsTool = createTool({
    name: "calculate_bollinger_bands",
    description: "Calculate Bollinger Bands (upper, middle, lower) for a price series.",
    tags: ["finance", "technical-indicator", "volatility"],
    parameters: z.object({
        values: numberSeriesSchema,
        period: z.number().int().min(2).default(20),
        stdDev: z.number().positive().default(2),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("calculate_bollinger_bands: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("calculate_bollinger_bands: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("calculate_bollinger_bands: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ values, period, stdDev }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        if (values.length < period) {
            throw new Error(`Price series length (${values.length}) must be >= period (${period}).`);
        }

        return {
            period,
            stdDev,
            offset: period - 1,
            bands: BollingerBands.calculate({ period, values, stdDev }).map((entry) => ({
                upper: entry.upper,
                middle: entry.middle,
                lower: entry.lower,
            })),
        };
    },
});

export const calculateOhlcIndicatorsTool = createTool({
    name: "calculate_ohlc_indicators",
    description: "Calculate ATR, ADX, and Stochastic Oscillator from OHLC data.",
    tags: ["finance", "technical-indicator", "ohlc"],
    parameters: z.object({
        high: numberSeriesSchema,
        low: numberSeriesSchema,
        close: numberSeriesSchema,
        atrPeriod: z.number().int().min(2).default(14),
        adxPeriod: z.number().int().min(2).default(14),
        stochasticPeriod: z.number().int().min(2).default(14),
        signalPeriod: z.number().int().min(2).default(3),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("calculate_ohlc_indicators: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("calculate_ohlc_indicators: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("calculate_ohlc_indicators: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ high, low, close, atrPeriod, adxPeriod, stochasticPeriod, signalPeriod }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        if (high.length !== low.length || low.length !== close.length) {
            throw new Error("High, low, and close series must have equal lengths.");
        }

        return {
            atr: ATR.calculate({ high, low, close, period: atrPeriod }),
            adx: ADX.calculate({ high, low, close, period: adxPeriod }).map((entry) => entry.adx),
            stochastic: Stochastic.calculate({
                high,
                low,
                close,
                period: stochasticPeriod,
                signalPeriod,
            }).map((entry) => ({
                k: entry.k,
                d: entry.d,
            })),
            atrPeriod,
            adxPeriod,
            stochasticPeriod,
            signalPeriod,
        };
    },
});

export const summarizeReturnsTool = createTool({
    name: "summarize_returns",
    description: "Compute return series and descriptive statistics from price data.",
    tags: ["finance", "returns"],
    parameters: z.object({
        prices: numberSeriesSchema,
        periodsPerYear: z.number().int().positive().default(252),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("summarize_returns: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("summarize_returns: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("summarize_returns: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ prices, periodsPerYear }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        const returns = prices.slice(1).map((price, index) => {
            const previous = prices[index];
            if (previous === 0) {
                throw new Error("Price series contains a zero value, cannot compute returns.");
            }
            return (price - previous) / previous;
        });

        if (returns.length < 2) {
            throw new Error("At least three prices are required to compute return statistics.");
        }

        const standardDeviation = sampleStandardDeviation(returns);

        return {
            count: returns.length,
            mean: mean(returns),
            median: median(returns),
            min: Math.min(...returns),
            max: Math.max(...returns),
            variance: sampleVariance(returns),
            standardDeviation,
            annualizedVolatility: standardDeviation * Math.sqrt(periodsPerYear),
            skewness: returns.length >= 3 ? sampleSkewness(returns) : null,
            kurtosis: returns.length >= 4 ? sampleKurtosis(returns) : null,
            quartiles: {
                q1: quantile(returns, 0.25),
                q3: quantile(returns, 0.75),
            },
            returns,
        };
    },
});

export const calculateDrawdownTool = createTool({
    name: "calculate_drawdowns",
    description: "Calculate drawdown series and max drawdown from price data.",
    tags: ["finance", "risk"],
    parameters: z.object({
        prices: numberSeriesSchema,
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("calculate_drawdowns: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("calculate_drawdowns: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("calculate_drawdowns: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ prices }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        let peak = prices[0];
        let maxDrawdown = 0;
        let maxDrawdownPercent = 0;

        const drawdowns = prices.map((price) => {
            peak = Math.max(peak, price);
            const drawdown = price - peak;
            const drawdownPercent = peak === 0 ? 0 : drawdown / peak;
            maxDrawdown = Math.min(maxDrawdown, drawdown);
            maxDrawdownPercent = Math.min(maxDrawdownPercent, drawdownPercent);
            return {
                peak,
                trough: price,
                drawdown,
                drawdownPercent,
            };
        });

        return {
            maxDrawdown,
            maxDrawdownPercent,
            drawdowns,
        };
    },
});

export const compareBenchmarkTool = createTool({
    name: "compare_benchmark",
    description: "Compare asset returns to a benchmark (beta, alpha, correlation, tracking error).",
    tags: ["finance", "benchmark"],
    parameters: z.object({
        assetReturns: numberSeriesSchema,
        benchmarkReturns: numberSeriesSchema,
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("compare_benchmark: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("compare_benchmark: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("compare_benchmark: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ assetReturns, benchmarkReturns }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        if (assetReturns.length !== benchmarkReturns.length) {
            throw new Error("Asset and benchmark returns must have equal lengths.");
        }

        const correlation = sampleCorrelation(assetReturns, benchmarkReturns);
        const benchmarkVariance = sampleVariance(benchmarkReturns);
        const covariance =
            correlation * sampleStandardDeviation(assetReturns) * sampleStandardDeviation(benchmarkReturns);
        const beta = benchmarkVariance === 0 ? 0 : covariance / benchmarkVariance;

        return {
            beta,
            alpha: mean(assetReturns) - beta * mean(benchmarkReturns),
            correlation,
            trackingError: sampleStandardDeviation(
                assetReturns.map((value, index) => value - benchmarkReturns[index]),
            ),
            excessReturn: mean(assetReturns) - mean(benchmarkReturns),
        };
    },
});

export const trendRegressionTool = createTool({
    name: "trend_regression",
    description: "Fit a linear regression trend to a price series and return slope, intercept, and R².",
    tags: ["finance", "trend"],
    parameters: z.object({
        values: numberSeriesSchema,
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("trend_regression: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("trend_regression: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("trend_regression: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ values }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        const pairs = values.map((value, index) => [index, value] as [number, number]);
        const regression = linearRegression(pairs);
        const line = linearRegressionLine(regression);

        return {
            slope: regression.m,
            intercept: regression.b,
            rSquared: rSquared(pairs, line),
            fitted: values.map((_, index) => line(index)),
        };
    },
});

export const momentumScoreTool = createTool({
    name: "momentum_score",
    description: "Compute a momentum score using recent return and volatility for ranking assets.",
    tags: ["finance", "momentum"],
    parameters: z.object({
        prices: numberSeriesSchema,
        lookback: z.number().int().min(2).default(20),
    }),
    hooks: {
        onStart: ({ tool, args, options }: ToolHookOnStartArgs) => {
            voltlogger.info("momentum_score: start", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
                args,
            });
        },
        onEnd: ({ tool, error, options }: ToolHookOnEndArgs) => {
            if (error !== undefined && error !== null) {
                voltlogger.error("momentum_score: error", {
                    tool: tool.name,
                    operationId: options?.operationId,
                    toolCallId: options?.toolContext?.callId,
                    error: error instanceof Error ? error.message : "Tool error",
                });
                return undefined;
            }

            voltlogger.info("momentum_score: end", {
                tool: tool.name,
                operationId: options?.operationId,
                toolCallId: options?.toolContext?.callId,
            });
            return undefined;
        },
    },
    execute: ({ prices, lookback }, options) => {
        if (options?.isActive === false) {
            throw new Error("Operation was cancelled");
        }
        if (options?.abortController?.signal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }
        if (options?.toolContext?.abortSignal?.aborted === true) {
            throw new Error("Operation was cancelled");
        }

        if (prices.length < lookback + 1) {
            throw new Error(`Price series length (${prices.length}) must be >= lookback + 1 (${lookback + 1}).`);
        }

        const window = prices.slice(-lookback - 1);
        const returns = window.slice(1).map((price, index) => (price - window[index]) / window[index]);
        const recentReturn = returns[returns.length - 1];
        const volatility = sampleStandardDeviation(returns);

        return {
            score: volatility === 0 ? 0 : recentReturn / volatility,
            recentReturn,
            volatility,
        };
    },
});

export const financialAnalysisToolkit = createToolkit({
    name: "financial_analysis_toolkit",
    description: "Technical indicators, risk metrics, and benchmarking tools for market time series.",
    instructions:
        "Use these tools for market-series analysis. Ensure series are aligned (same sampling/length) before comparisons.",
    addInstructions: true,
    tools: [
        calculateMovingAverageTool,
        calculateRsiTool,
        calculateMacdTool,
        calculateBollingerBandsTool,
        calculateOhlcIndicatorsTool,
        summarizeReturnsTool,
        calculateDrawdownTool,
        compareBenchmarkTool,
        trendRegressionTool,
        momentumScoreTool,
    ] as Tool[],
});
