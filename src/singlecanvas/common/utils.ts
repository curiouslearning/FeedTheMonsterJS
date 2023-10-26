import { Debugger, lang } from "../../../global-variables";
import languageFontMapping from "../data/i18-font-mapping";

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

    public static getLanguageSpecificFont(language: string): string {
        const lowerCaseLanguage = language.toLowerCase();
      
        for (const key in languageFontMapping) {
          if (key.toLowerCase() === lowerCaseLanguage) {
            return languageFontMapping[key];
          }
        }
        
        console.log(`Font not found for language: ${language}`);
        return 'Sans-serif';
      } 
}
