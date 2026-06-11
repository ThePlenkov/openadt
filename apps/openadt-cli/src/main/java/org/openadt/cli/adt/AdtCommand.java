package org.openadt.cli.adt;

import org.openadt.config.CliLog;

import picocli.CommandLine;
import picocli.CommandLine.Command;

/**
 * Parent of all {@code openadt adt <verb>} subcommands.
 *
 * <p>ADT-specific CLI commands for ABAP development tools.</p>
 */
@Command(
    name = "adt",
    mixinStandardHelpOptions = true,
    description = "OpenADT ADT commands for ABAP development",
    subcommands = {}
)
public class AdtCommand implements Runnable {

    @Override
    public void run() {
        new CommandLine(this).usage(CliLog.stdout());
    }
}
