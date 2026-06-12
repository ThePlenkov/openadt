class AdtLspMcp < Formula
  desc "ADT LSP MCP server - stdio-only MCP for OpenADT tools (compiled Bun binary)"
  homepage "https://github.com/abapify/openadt"
  license "Apache-2.0"

  STABLE = "0.1.0"
  url "https://github.com/abapify/openadt/releases/download/v#{STABLE}/adt-lsp-mcp-#{STABLE}-darwin-arm64.tar.gz"
  sha256 "PLACEHOLDER_RUN_PACKAGE_RELEASE"
  version STABLE

  head "https://github.com/abapify/openadt.git", branch: "main"

  def install
    bin.install "adt-lsp-mcp"
  end

  test do
    assert_match "ADT LSP MCP server started", shell_output("#{bin}/adt-lsp-mcp --help 2>&1", 2)
  end

  def caveats
    <<~EOS
      adt-lsp-mcp provides 26 OpenADT tools via stdio MCP (adt_* prefix).
      It requires SAP ADT for VS Code (adt-lsc) but has no Java dependency of its own.

      Install the SAP ADT for VS Code extension:
        https://marketplace.visualstudio.com/items?itemName=SAPSE.adt-vscode
    EOS
  end
end
