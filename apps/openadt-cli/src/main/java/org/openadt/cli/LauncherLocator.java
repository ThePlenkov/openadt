package org.openadt.cli;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/** Locates the dev-clone Bun SAP ADT MCP launcher (or its `tools/` mirror) by
 *  checking {@code OPENADT_HOME} / {@code OPENADT_REPO}, then walking up the CWD.
 *  Extracted from {@link McpLauncherInvoker} so its caller stays focused on
 *  the native-binary dispatch path. */
final class LauncherLocator {
    private static final String[] LAUNCHER_REL_PATHS = {
        "sap-adt-mcp-launcher/dist/main.mjs",
        "sap-adt-mcp-launcher/dist/main.js",
        "sap-adt-mcp-launcher/src/main.ts",
        "tools/sap-adt-mcp-launcher/dist/main.mjs",
        "tools/sap-adt-mcp-launcher/dist/main.js",
        "tools/sap-adt-mcp-launcher/src/main.ts",
    };
    private static final int CWD_WALK_MAX_DEPTH = 8;

    private LauncherLocator() {}

    static Path resolve() {
        Path envHit = findInEnvBases();
        if (envHit != null) {
            return envHit;
        }
        return findFromCwd();
    }

    private static Path findInEnvBases() {
        for (String base : envBases()) {
            Path hit = findInRoot(Path.of(base), true);
            if (hit != null) {
                return hit;
            }
        }
        return null;
    }

    private static Path findFromCwd() {
        Path cwd = Path.of("").toAbsolutePath();
        for (int depth = 0; depth < CWD_WALK_MAX_DEPTH && cwd != null; depth++) {
            Path hit = findInRoot(cwd, false);
            if (hit != null) {
                return hit;
            }
            cwd = cwd.getParent();
        }
        return null;
    }

    private static Path findInRoot(Path root, boolean absolute) {
        for (String rel : LAUNCHER_REL_PATHS) {
            Path candidate = root.resolve(rel);
            if (Files.isRegularFile(candidate)) {
                return absolute
                        ? candidate.toAbsolutePath().normalize()
                        : candidate.normalize();
            }
        }
        return null;
    }

    private static List<String> envBases() {
        List<String> bases = new ArrayList<>();
        String home = System.getenv("OPENADT_HOME");
        if (home != null && !home.isBlank()) {
            bases.add(home.trim());
        }
        String repo = System.getenv("OPENADT_REPO");
        if (repo != null && !repo.isBlank()) {
            bases.add(repo.trim());
        }
        return bases;
    }

    static String[] relativePaths() {
        return LAUNCHER_REL_PATHS;
    }

    static Path walkUpSegments(Path start, int segments) {
        Path current = start;
        for (int i = 0; i < segments; i++) {
            Path parent = current.getParent();
            if (parent == null) {
                return current;
            }
            current = parent;
        }
        return current;
    }

    static String matchedRelPath(Path launcherMain) {
        String normalized = launcherMain.toString().replace('\\', '/');
        for (String rel : LAUNCHER_REL_PATHS) {
            if (normalized.endsWith("/" + rel) || normalized.equals(rel)) {
                return rel;
            }
        }
        return null;
    }

    static void applyRepoEnv(ProcessBuilder pb, Path launcherMain) {
        String rel = matchedRelPath(launcherMain);
        Path repoRoot =
                rel == null ? launcherMain : walkUpSegments(launcherMain, rel.split("/").length);
        if (!Files.isDirectory(repoRoot)) {
            return;
        }
        String root = repoRoot.toString();
        pb.environment().putIfAbsent("OPENADT_HOME", root);
        pb.environment().putIfAbsent("OPENADT_REPO", root);
    }
}
