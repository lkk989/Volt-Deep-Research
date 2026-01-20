declare module 'svgjson' {
  interface SVGJsonResult {
    [key: string]: any
  }

  interface SVGJson {
    svg2json(svgString: string): SVGJsonResult
    json2svg(jsonData: SVGJsonResult): string
  }

  const svgjson: SVGJson
  export = svgjson
}