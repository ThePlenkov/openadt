package org.openadt.cli;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.Locale;

/** Locates the standalone {@code openadt-mcp} binary either via
 *  {@code OPENADT_MCP} env override, via {@code PATH} scan, or via the
 *  dev-clone launcher main path. Extracted from {@link McpLauncherInvoker}
 *  to keep the caller focused on the dispatch path. */
final class BinaryLocator {
    private static final String[] NATIVE_BINARY_NAMES_WINDOWS = {
        "openadt-mcp.exe",
        "openadt-mcp.cmd",
        "openadt-mcp",
    };
    private static final String[] NATIVE_BINARY_NAMES_UNIX = {
        "openadt-mcp",
    };

    private BinaryLocator() {}

    static Path resolveOpenAdtMcpBinary() {
        Path override = tryOpenAdtMcpOverride();
        if (override != null) {
            return override;
        }
        return scanPathForBinary();
    }

    private static Path tryOpenAdtMcpOverride() {
        String override = System.getenv("OPENADT_MCP");
        if (override == null || override.isBlank()) {
            return null;
        }
        Path envHit;
        try {
            envHit = Path.of(override.trim());
        } catch (InvalidPathException e) {
            return null;
        }
        if (Files.isRegularFile(envHit) && Files.isExecutable(envHit)) {
            return envHit.toAbsolutePath().normalize();
        }
        return null;
    }

    private static Path scanPathForBinary() {
        String pathEnv = System.getenv("PATH");
        if (pathEnv == null) {
            return null;
        }
        for (String dir : pathEnv.split(File.pathSeparator)) {
            if (dir.isBlank()) {
                continue;
            }
            Path hit = firstExecutableInDir(dir);
            if (hit != null) {
                return hit;
            }
        }
        return null;
    }

    private static Path firstExecutableInDir(String dir) {
        for (String name : candidateBinaryNames()) {
            Path candidate = resolveSafe(dir, name);
            if (isExecutable(candidate)) {
                return candidate.toAbsolutePath().normalize();
            }
        }
        return null;
    }

    private static String[] candidateBinaryNames() {
        return isWindows() ? NATIVE_BINARY_NAMES_WINDOWS : NATIVE_BINARY_NAMES_UNIX;
    }

    private static boolean isExecutable(Path candidate) {
        return candidate != null
                && Files.isRegularFile(candidate)
                && Files.isExecutable(candidate);
    }

    private static Path resolveSafe(String dir, String name) {
        try {
            return Path.of(dir).resolve(name);
        } catch (InvalidPathException ignored) {
            return null;
        }
    }

    static String resolveBunExecutable() {
        String override = System.getenv("OPENADT_BUN");
        if (override != null && !override.isBlank()) {
            return override.trim();
        }
        return isWindows() ? "bun.exe" : "bun";
    }

    private static boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("win");
    }
}
