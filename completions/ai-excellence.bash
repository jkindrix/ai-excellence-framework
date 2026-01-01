#!/bin/bash
# Bash completion for ai-excellence (aix) CLI
# Install: source this file or add to ~/.bashrc
# Or copy to /etc/bash_completion.d/ai-excellence

_ai_excellence_completions() {
    local cur prev opts commands
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    # Main commands
    commands="init validate doctor update generate lint uninstall detect help"

    # Global options
    global_opts="--help --version"

    # Command-specific options
    case "${prev}" in
        init)
            opts="--preset --force --dry-run --skip-hooks --skip-mcp --skip-precommit --yes"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        --preset)
            opts="minimal standard full team"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        validate)
            opts="--fix --strict --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        doctor)
            opts="--verbose --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        update)
            opts="--check --force --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        generate)
            opts="--tools --output --dry-run --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        --tools)
            opts="all cursor copilot windsurf aider agents gemini codex zed amp roo junie cline goose kiro continue augment qodo opencode zencoder tabnine amazonq skills plugins"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        detect)
            opts="--verbose --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        lint)
            opts="--fix --format --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        uninstall)
            opts="--force --keep-config --dry-run"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        ai-excellence|aix)
            COMPREPLY=( $(compgen -W "${commands} ${global_opts}" -- ${cur}) )
            return 0
            ;;
    esac

    # Default: complete commands
    if [[ ${cur} == -* ]] ; then
        COMPREPLY=( $(compgen -W "${global_opts}" -- ${cur}) )
    else
        COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
    fi
}

complete -F _ai_excellence_completions ai-excellence
complete -F _ai_excellence_completions aix
