# Fish completion for ai-excellence (aix) CLI
# Install: Copy to ~/.config/fish/completions/ai-excellence.fish

# Disable file completion by default
complete -c ai-excellence -f
complete -c aix -f

# Main commands
complete -c ai-excellence -n "__fish_use_subcommand" -a "init" -d "Initialize framework in project"
complete -c ai-excellence -n "__fish_use_subcommand" -a "validate" -d "Validate configuration"
complete -c ai-excellence -n "__fish_use_subcommand" -a "doctor" -d "Check environment health"
complete -c ai-excellence -n "__fish_use_subcommand" -a "update" -d "Check for updates"
complete -c ai-excellence -n "__fish_use_subcommand" -a "generate" -d "Generate tool configs"
complete -c ai-excellence -n "__fish_use_subcommand" -a "lint" -d "Lint configuration"
complete -c ai-excellence -n "__fish_use_subcommand" -a "uninstall" -d "Remove framework"
complete -c ai-excellence -n "__fish_use_subcommand" -a "detect" -d "Detect configured AI tools"
complete -c ai-excellence -n "__fish_use_subcommand" -a "help" -d "Show help"

# Alias completions
complete -c aix -n "__fish_use_subcommand" -a "init" -d "Initialize framework in project"
complete -c aix -n "__fish_use_subcommand" -a "validate" -d "Validate configuration"
complete -c aix -n "__fish_use_subcommand" -a "doctor" -d "Check environment health"
complete -c aix -n "__fish_use_subcommand" -a "update" -d "Check for updates"
complete -c aix -n "__fish_use_subcommand" -a "generate" -d "Generate tool configs"
complete -c aix -n "__fish_use_subcommand" -a "lint" -d "Lint configuration"
complete -c aix -n "__fish_use_subcommand" -a "uninstall" -d "Remove framework"
complete -c aix -n "__fish_use_subcommand" -a "detect" -d "Detect configured AI tools"
complete -c aix -n "__fish_use_subcommand" -a "help" -d "Show help"

# Global options
complete -c ai-excellence -s h -l help -d "Show help"
complete -c ai-excellence -s v -l version -d "Show version"
complete -c aix -s h -l help -d "Show help"
complete -c aix -s v -l version -d "Show version"

# init options
complete -c ai-excellence -n "__fish_seen_subcommand_from init" -l preset -d "Use preset" -xa "minimal standard full team"
complete -c ai-excellence -n "__fish_seen_subcommand_from init" -l force -d "Overwrite existing"
complete -c ai-excellence -n "__fish_seen_subcommand_from init" -l dry-run -d "Preview changes"
complete -c ai-excellence -n "__fish_seen_subcommand_from init" -l skip-hooks -d "Skip hooks"
complete -c ai-excellence -n "__fish_seen_subcommand_from init" -l skip-mcp -d "Skip MCP server"
complete -c ai-excellence -n "__fish_seen_subcommand_from init" -l skip-precommit -d "Skip pre-commit"
complete -c ai-excellence -n "__fish_seen_subcommand_from init" -l yes -d "Accept defaults"
complete -c ai-excellence -n "__fish_seen_subcommand_from init" -l json -d "JSON output"

# validate options
complete -c ai-excellence -n "__fish_seen_subcommand_from validate" -l fix -d "Auto-fix issues"
complete -c ai-excellence -n "__fish_seen_subcommand_from validate" -l strict -d "Strict mode"
complete -c ai-excellence -n "__fish_seen_subcommand_from validate" -l json -d "JSON output"

# doctor options
complete -c ai-excellence -n "__fish_seen_subcommand_from doctor" -l verbose -d "Verbose output"
complete -c ai-excellence -n "__fish_seen_subcommand_from doctor" -l json -d "JSON output"

# update options
complete -c ai-excellence -n "__fish_seen_subcommand_from update" -l check -d "Check only"
complete -c ai-excellence -n "__fish_seen_subcommand_from update" -l force -d "Force update"
complete -c ai-excellence -n "__fish_seen_subcommand_from update" -l json -d "JSON output"

# generate options
complete -c ai-excellence -n "__fish_seen_subcommand_from generate" -l tools -d "Tools to generate" -xa "all cursor copilot windsurf aider agents gemini codex zed amp roo junie cline goose kiro continue augment qodo opencode zencoder tabnine amazonq skills plugins"
complete -c ai-excellence -n "__fish_seen_subcommand_from generate" -l output -d "Output directory" -xa "(__fish_complete_directories)"
complete -c ai-excellence -n "__fish_seen_subcommand_from generate" -l dry-run -d "Preview changes"
complete -c ai-excellence -n "__fish_seen_subcommand_from generate" -l force -d "Overwrite existing"
complete -c ai-excellence -n "__fish_seen_subcommand_from generate" -l json -d "JSON output"

# detect options
complete -c ai-excellence -n "__fish_seen_subcommand_from detect" -l verbose -d "Show detailed info"
complete -c ai-excellence -n "__fish_seen_subcommand_from detect" -l json -d "JSON output"

# lint options
complete -c ai-excellence -n "__fish_seen_subcommand_from lint" -l fix -d "Auto-fix issues"
complete -c ai-excellence -n "__fish_seen_subcommand_from lint" -l format -d "Output format" -xa "text json"
complete -c ai-excellence -n "__fish_seen_subcommand_from lint" -l json -d "JSON output"

# uninstall options
complete -c ai-excellence -n "__fish_seen_subcommand_from uninstall" -l force -d "Force removal"
complete -c ai-excellence -n "__fish_seen_subcommand_from uninstall" -l keep-config -d "Keep config files"
complete -c ai-excellence -n "__fish_seen_subcommand_from uninstall" -l dry-run -d "Preview removal"

# Copy completions for aix alias
complete -c aix -n "__fish_seen_subcommand_from init" -l preset -d "Use preset" -xa "minimal standard full team"
complete -c aix -n "__fish_seen_subcommand_from init" -l force -d "Overwrite existing"
complete -c aix -n "__fish_seen_subcommand_from init" -l dry-run -d "Preview changes"
complete -c aix -n "__fish_seen_subcommand_from init" -l skip-hooks -d "Skip hooks"
complete -c aix -n "__fish_seen_subcommand_from init" -l skip-mcp -d "Skip MCP server"
complete -c aix -n "__fish_seen_subcommand_from init" -l skip-precommit -d "Skip pre-commit"
complete -c aix -n "__fish_seen_subcommand_from init" -l yes -d "Accept defaults"
complete -c aix -n "__fish_seen_subcommand_from init" -l json -d "JSON output"
complete -c aix -n "__fish_seen_subcommand_from validate" -l fix -d "Auto-fix issues"
complete -c aix -n "__fish_seen_subcommand_from validate" -l strict -d "Strict mode"
complete -c aix -n "__fish_seen_subcommand_from validate" -l json -d "JSON output"
complete -c aix -n "__fish_seen_subcommand_from doctor" -l verbose -d "Verbose output"
complete -c aix -n "__fish_seen_subcommand_from doctor" -l json -d "JSON output"
complete -c aix -n "__fish_seen_subcommand_from update" -l check -d "Check only"
complete -c aix -n "__fish_seen_subcommand_from update" -l force -d "Force update"
complete -c aix -n "__fish_seen_subcommand_from update" -l json -d "JSON output"
complete -c aix -n "__fish_seen_subcommand_from generate" -l tools -d "Tools to generate" -xa "all cursor copilot windsurf aider agents gemini codex zed amp roo junie cline goose kiro continue augment qodo opencode zencoder tabnine amazonq skills plugins"
complete -c aix -n "__fish_seen_subcommand_from generate" -l output -d "Output directory" -xa "(__fish_complete_directories)"
complete -c aix -n "__fish_seen_subcommand_from generate" -l dry-run -d "Preview changes"
complete -c aix -n "__fish_seen_subcommand_from generate" -l force -d "Overwrite existing"
complete -c aix -n "__fish_seen_subcommand_from generate" -l json -d "JSON output"
complete -c aix -n "__fish_seen_subcommand_from lint" -l fix -d "Auto-fix issues"
complete -c aix -n "__fish_seen_subcommand_from lint" -l format -d "Output format" -xa "text json"
complete -c aix -n "__fish_seen_subcommand_from lint" -l json -d "JSON output"
complete -c aix -n "__fish_seen_subcommand_from uninstall" -l force -d "Force removal"
complete -c aix -n "__fish_seen_subcommand_from uninstall" -l keep-config -d "Keep config files"
complete -c aix -n "__fish_seen_subcommand_from uninstall" -l dry-run -d "Preview removal"
complete -c aix -n "__fish_seen_subcommand_from detect" -l verbose -d "Show detailed info"
complete -c aix -n "__fish_seen_subcommand_from detect" -l json -d "JSON output"
