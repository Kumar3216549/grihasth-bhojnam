import { cookies } from "next/headers";
import { DEFAULT_LANG, DICTS, type Lang } from "./i18n";

export function getLang(): Lang {
  const v = cookies().get("lang")?.value;
  return v === "en" || v === "hi" ? v : DEFAULT_LANG;
}

export function getDict() {
  const lang = getLang();
  return { lang, t: DICTS[lang] };
}
