export function isURL(str: string): boolean {
    const pattern = new RegExp("^(https?:\\/\\/)?" + // protocol
      "((([a-zA-Z\\d]([a-zA-Z\\d-]{0,61}[a-zA-Z\\d])?)\\.)+" + // subdomain
      "[a-zA-Z]{2,13})" + // domain name
      "(\\:[\\d]{1,5})?" + // port
      "(\\/[\\/\\w\\.-]*)*\\/?" + // path
      "(\\?[\\w\\&\\=\\.\\-]+)?" + // query string
      "(\\#[\\w\\-]+)?$", "i"); // hash fragment
  
    return pattern.test(str);
  }
  