import type { CipherDatabaseData } from "$lib/types";

/** Maps engine name to the standard connection URL scheme. */
export const ENGINE_SCHEMES: Record<string, string> = {
    "PostgreSQL": "postgresql",
    "MySQL": "mysql",
    "MongoDB": "mongodb",
    "Redis": "redis",
    "SQLite": "sqlite",
    "Oracle": "oracle",
    "SQL Server": "mssql",
    "MariaDB": "mariadb",
    "Cassandra": "cassandra",
    "Elasticsearch": "http",
};

/**
 * Builds a connection URL string from individual parameter fields.
 * e.g. postgresql://user:pass@localhost:5432/mydb
 */
export function paramsToUrl(data: Pick<CipherDatabaseData, "engine" | "host" | "port" | "database" | "username" | "password">): string {
    const scheme = ENGINE_SCHEMES[data.engine ?? ""] ?? "db";
    const userInfo = data.username
        ? `${encodeURIComponent(data.username)}${data.password ? `:${encodeURIComponent(data.password)}` : ""}@`
        : "";
    const hostPort = data.host
        ? `${data.host}${data.port ? `:${data.port}` : ""}`
        : "";
    const dbPath = data.database ? `/${data.database}` : "";
    return `${scheme}://${userInfo}${hostPort}${dbPath}`;
}

/**
 * Parses a connection URL string into individual parameter fields.
 * Returns empty strings for any components that could not be parsed.
 */
export function urlToParams(url: string): { engine: string; host: string; port: string; database: string; username: string; password: string } {
    try {
        const regex = /^(?:(?<scheme>[a-zA-Z][a-zA-Z0-9+\-.]*):\/\/)?(?:(?<username>[^:]+)(?::(?<password>[^@]*))?@)?(?<host>[^:\/]+)(?::(?<port>\d+))?(?:\/(?<database>.*))?$/;
        const match = url.match(regex);

        if (!match || !match.groups) {
             return { engine: "", host: "", port: "", database: "", username: "", password: "" };
        }

        const g = match.groups;
        const scheme = g.scheme ? g.scheme.toLowerCase() : "";

        // Identify engine from scheme by reverse lookup
        let engine = "";
        if (scheme) {
            for (const [name, s] of Object.entries(ENGINE_SCHEMES)) {
                if (s === scheme) {
                    engine = name;
                    break;
                }
            }
        }

        return {
            engine,
            host: g.host ? decodeURIComponent(g.host) : "",
            port: g.port || "",
            database: g.database ? decodeURIComponent(g.database) : "",
            username: g.username ? decodeURIComponent(g.username) : "",
            password: g.password ? decodeURIComponent(g.password) : "",
        };
    } catch {
        return { engine: "", host: "", port: "", database: "", username: "", password: "" };
    }
}
