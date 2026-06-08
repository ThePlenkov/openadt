package org.openadt.cli;

import org.openadt.config.CliLog;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/** Delegates {@code openadt mcp *} to the standalone {@code openadt-mcp} binary
 *  (fast path) or, in a dev clone, to the Bun SAP ADT MCP launcher (fallback). */
final class McpLauncherInvoker {
    private McpLauncherInvoker() {}

    static int invoke(String subcommand, String[] extraArgs) {
        McpLaunchPlan plan = chooseLaunchPlan();
        if (plan == null) {
            CliLog.error("""
                    openadt-mcp is not installed and no dev clone was found.
                    Install: scoop install openadt-mcp
                           brew install openadt-mcp
                    Or set OPENADT_REPO to your git clone (and have Bun on PATH).""");
            return 1;
        }
        return plan.kind() == McpLaunchKind.NATIVE
                ? spawnDirect(plan.executable(), subcommand, extraArgs)
                : spawnBun(plan.executable(), subcommand, extraArgs);
    }

    static Path resolveOpenAdtMcpBinary() {
        return BinaryLocator.resolveOpenAdtMcpBinary();
    }

    static Path resolveLauncherMain() {
        return LauncherLocator.resolve();
    }

    private static McpLaunchPlan chooseLaunchPlan() {
        Path nativeBinary = resolveOpenAdtMcpBinary();
        if (nativeBinary != null) {
            return new McpLaunchPlan(McpLaunchKind.NATIVE, nativeBinary);
        }
        Path devScript = resolveLauncherMain();
        if (devScript != null) {
            return new McpLaunchPlan(McpLaunchKind.DEV_CLONE, devScript);
        }
        return null;
    }

    private static int spawnDirect(Path binary, String subcommand, String[] extraArgs) {
        return runAndWait(
            new ProcessBuilder(buildArgv(toRequest(binary, subcommand, extraArgs, null))),
            "openadt-mcp");
    }

    private static int spawnBun(Path script, String subcommand, String[] extraArgs) {
        ProcessBuilder pb = new ProcessBuilder(
                buildArgv(toRequest(script, subcommand, extraArgs, BinaryLocator.resolveBunExecutable())));
        LauncherLocator.applyRepoEnv(pb, script);
        return runAndWait(pb, "MCP launcher");
    }

    private static McpLaunchRequest toRequest(
            Path executable, String subcommand, String[] extraArgs, String prefix) {
        return new McpLaunchRequest(
                executable,
                subcommand,
                extraArgs == null || extraArgs.length == 0 ? List.of() : List.of(extraArgs),
                prefix);
    }

    private static int runAndWait(ProcessBuilder pb, String errorLabel) {
        pb.inheritIO();
        try {
            return pb.start().waitFor();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            CliLog.error("Failed to run " + errorLabel + ": " + e.getMessage());
            return 1;
        } catch (IOException e) {
            CliLog.error("Failed to run " + errorLabel + ": " + e.getMessage());
            return 1;
        }
    }

    private static List<String> buildArgv(McpLaunchRequest req) {
        List<String> cmd = new ArrayList<>();
        if (req.prefix() != null) {
            cmd.add(req.prefix());
        }
        cmd.add(req.executable().toString());
        cmd.add(req.subcommand());
        if (!req.extraArgs().isEmpty()) {
            cmd.addAll(req.extraArgs());
        }
        return cmd;
    }

    /** Bundles the resolved launcher with a discriminator so internal helpers
     *  can take a single record instead of (Path, kind) primitives. */
    private record McpLaunchPlan(McpLaunchKind kind, Path executable) {}

    /** Bundles everything needed to build a process argv for either the
     *  native binary or the Bun-spawned dev script. {@code prefix} is the
     *  optional binary name to invoke through (e.g. {@code "bun"}). */
    private record McpLaunchRequest(
            Path executable,
            String subcommand,
            List<String> extraArgs,
            String prefix) {}

    private enum McpLaunchKind { NATIVE, DEV_CLONE }
}
