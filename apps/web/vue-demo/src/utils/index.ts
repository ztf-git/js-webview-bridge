// 判断字符串是否是可解析的对象或数组类型
export function isJsonStr(str: string) {
  if (str == null) return false;
  try {
    const parsed = JSON.parse(str);
    // 检查解析后的结果是否是对象或数组
    return typeof parsed === "object" && parsed !== null;
  } catch (e) {
    return false; // 如果抛出异常，说明无法解析
  }
}
