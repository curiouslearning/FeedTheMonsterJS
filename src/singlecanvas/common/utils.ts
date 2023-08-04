import { Debugger } from "../../../global-variables";

export class Utils {
    public static UrlSubstring: string = '/feedthemonster'

    public static getConvertedDevProdURL(url: string): string {
        return Debugger.DevelopmentLink
            ? url.slice(
                0,
                url.indexOf(this.UrlSubstring) +
                this.UrlSubstring.length
            ) +
            "dev" +
            url.slice(
                url.indexOf(this.UrlSubstring) +
                this.UrlSubstring.length
            )
            : url;
    }
}