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
        McpLaunchRequest req = McpLaunchRequest.of(plan.executable(), subcommand, extraArgs, null);
        return plan.kind() == McpLaunchKind.NATIVE
                ? dispatchDirect(req)
                : dispatchBun(req);
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

    private static int dispatchDirect(McpLaunchRequest req) {
        return ProcessSpawner.runAndWait(new ProcessBuilder(buildArgv(req)), "openadt-mcp");
    }

    private static int dispatchBun(McpLaunchRequest req) {
        ProcessBuilder pb = new ProcessBuilder(
                buildArgv(McpLaunchRequest.of(
                        req.executable(),
                        req.subcommand(),
                        req.extraArgs().toArray(new String[0]),
                        BinaryLocator.resolveBunExecutable())));
        LauncherLocator.applyRepoEnv(pb, req.executable());
        return ProcessSpawner.runAndWait(pb, "MCP launcher");
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
            String prefix) {
        static McpLaunchRequest of(
                Path executable, String subcommand, String[] extraArgs, String prefix) {
            return new McpLaunchRequest(
                    executable,
                    subcommand,
                    extraArgs == null || extraArgs.length == 0 ? List.of() : List.of(extraArgs),
                    prefix);
        }
    }

    private enum McpLaunchKind { NATIVE, DEV_CLONE }
}
