package org.openadt.cli;

import org.openadt.config.CliLog;

import java.io.IOException;

/** Spawns a child process and waits for it to finish, logging any failure
 *  with a stable label so callers don't have to repeat the try/catch boilerplate. */
final class ProcessSpawner {
    private ProcessSpawner() {}

    static int runAndWait(ProcessBuilder pb, String errorLabel) {
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
}
