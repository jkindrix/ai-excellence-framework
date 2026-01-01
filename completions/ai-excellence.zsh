#compdef ai-excellence aix
# Zsh completion for ai-excellence (aix) CLI
# Install: Add to fpath or source in .zshrc
# Example: fpath=(~/.zsh/completions $fpath)

_ai_excellence() {
    local -a commands
    local -a global_opts

    commands=(
        'init:Initialize AI Excellence Framework in current project'
        'validate:Validate framework configuration'
        'doctor:Check environment and installation health'
        'update:Check for and apply framework updates'
        'generate:Generate configurations for AI tools'
        'lint:Lint configuration files'
        'uninstall:Remove framework from project'
        'detect:Detect configured AI tools'
        'help:Show help information'
    )

    global_opts=(
        '--help[Show help message]'
        '--version[Show version number]'
    )

    _arguments -C \
        '1: :->command' \
        '*: :->args' \
        && return 0

    case "$state" in
        command)
            _describe -t commands 'ai-excellence commands' commands
            _describe -t options 'global options' global_opts
            ;;
        args)
            case "${words[2]}" in
                init)
                    _arguments \
                        '--preset[Use preset configuration]:preset:(minimal standard full team)' \
                        '--force[Overwrite existing files]' \
                        '--dry-run[Show what would be done without making changes]' \
                        '--skip-hooks[Skip hook installation]' \
                        '--skip-mcp[Skip MCP server setup]' \
                        '--skip-precommit[Skip pre-commit configuration]' \
                        '--yes[Accept all defaults]' \
                        '--json[Output in JSON format]'
                    ;;
                validate)
                    _arguments \
                        '--fix[Auto-fix issues where possible]' \
                        '--strict[Enable strict validation mode]' \
                        '--json[Output in JSON format]'
                    ;;
                doctor)
                    _arguments \
                        '--verbose[Show detailed information]' \
                        '--json[Output in JSON format]'
                    ;;
                update)
                    _arguments \
                        '--check[Check for updates without applying]' \
                        '--force[Force update even if current]' \
                        '--json[Output in JSON format]'
                    ;;
                generate)
                    _arguments \
                        '--tools[AI tools to generate configs for]:tools:_ai_excellence_tools' \
                        '--output[Output directory]:directory:_files -/' \
                        '--dry-run[Show what would be generated]' \
                        '--json[Output in JSON format]'
                    ;;
                lint)
                    _arguments \
                        '--fix[Auto-fix issues]' \
                        '--format[Output format]:format:(text json)' \
                        '--json[Output in JSON format]'
                    ;;
                uninstall)
                    _arguments \
                        '--force[Force removal without confirmation]' \
                        '--keep-config[Keep configuration files]' \
                        '--dry-run[Show what would be removed]'
                    ;;
                detect)
                    _arguments \
                        '--verbose[Show detailed information]' \
                        '--json[Output in JSON format]'
                    ;;
            esac
            ;;
    esac
}

_ai_excellence_tools() {
    local -a tools
    tools=(
        'all:Generate for all supported tools'
        'cursor:Cursor IDE'
        'copilot:GitHub Copilot'
        'windsurf:Windsurf IDE'
        'aider:Aider CLI'
        'agents:AGENTS.md standard'
        'gemini:Gemini CLI'
        'codex:OpenAI Codex'
        'zed:Zed Editor'
        'amp:Amp IDE'
        'roo:Roo Code'
        'junie:JetBrains Junie'
        'cline:Cline'
        'goose:Block Goose'
        'kiro:AWS Kiro'
        'continue:Continue.dev'
        'augment:Augment Code'
        'qodo:Qodo AI'
        'opencode:OpenCode'
        'zencoder:Zencoder'
        'tabnine:Tabnine'
        'amazonq:Amazon Q Developer'
        'skills:Agent Skills'
        'plugins:Claude Plugins'
    )
    _describe -t tools 'AI tools' tools
}

_ai_excellence "$@"
