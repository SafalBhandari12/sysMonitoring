import dns from "dns/promises";
dns.setServers(["8.8.8.8"]);

class VerificationService {
  static extractDomain(url: string): string {
    const urlObj = new URL(url);
    return urlObj.hostname;
  }

  static getBaseDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname;

      // Remove 'www.' prefix if present
      if (hostname.startsWith("www.")) {
        hostname = hostname.slice(4);
      }

      // Return URL with protocol and clean domain (no path, no trailing slash)
      return `${urlObj.protocol}//${hostname}`;
    } catch {
      // If not a valid URL, try to clean it up manually
      let cleaned = url.trim();

      // Ensure protocol exists
      if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
        cleaned = `https://${cleaned}`;
      }

      // Extract protocol
      const protocolMatch = cleaned.match(/^(https?:\/\/)/);
      const protocol = protocolMatch?.[1] || "https://";

      // Remove protocol temporarily
      let domain = cleaned.substring(protocol.length);

      // Remove path if present
      const pathIndex = domain.indexOf("/");
      if (pathIndex !== -1) {
        domain = domain.substring(0, pathIndex);
      }

      // Remove www. prefix if present
      if (domain.startsWith("www.")) {
        domain = domain.slice(4);
      }

      return `${protocol}${domain}`;
    }
  }

  static async verifyDomain(domain: string, token: string): Promise<boolean> {
    try {
      // Use the input as the hostname for DNS lookup
      const txtRecords = await dns.resolveTxt(domain);
      const expectedToken = `monitoring-verify=${token}`;
      for (const record of txtRecords) {
        if (record.join("") === expectedToken) {
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(`Error verifying domain ${domain}:`, e);
      return false;
    }
  }
}
export default VerificationService;
