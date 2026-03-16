use log::{error, info};
use std::process::Command;

#[derive(serde::Deserialize)]
pub struct ExternalTab {
    pub cwd: Option<String>,
    pub title: String,
    pub startup_cmd: Option<String>,
    pub shell: Option<String>,
}

fn shell_exe(shell: &str) -> (&'static str, Option<&'static str>) {
    match shell {
        "cmd" => ("cmd", Some("/K")),
        "pwsh" => ("pwsh", Some("-NoExit")),
        "wsl" => ("wsl", None),
        "bash" => ("bash", None),
        _ => ("powershell", Some("-NoExit")),
    }
}

fn push_tab_args(args: &mut Vec<String>, tab: &ExternalTab) {
    args.push("new-tab".into());
    if let Some(cwd) = &tab.cwd {
        args.push("-d".into());
        args.push(cwd.clone());
    }
    args.push("--title".into());
    args.push(tab.title.clone());
    args.push("--suppressApplicationTitle".into());

    let shell_key = tab.shell.as_deref().unwrap_or("powershell");
    let (exe, no_exit_flag) = shell_exe(shell_key);

    if let Some(cmd) = &tab.startup_cmd {
        let cmd = cmd.trim();
        if !cmd.is_empty() {
            args.push(exe.into());
            if let Some(flag) = no_exit_flag {
                args.push(flag.into());
            }
            if shell_key == "cmd" {
                args.push(cmd.into());
            } else {
                args.push("-Command".into());
                args.push(cmd.into());
            }
            return;
        }
    }
    args.push(exe.into());
}

#[tauri::command]
pub async fn open_windows_terminal(tabs: Vec<ExternalTab>) -> Result<(), String> {
    if tabs.is_empty() {
        return Ok(());
    }

    let mut args: Vec<String> = vec!["-w".into(), "0".into()];
    for (i, tab) in tabs.iter().enumerate() {
        if i > 0 {
            args.push(";".into());
        }
        push_tab_args(&mut args, &tab);
    }

    info!("open_windows_terminal: wt {}", args.join(" "));

    Command::new("wt")
        .args(&args)
        .spawn()
        .map_err(|e| {
            error!("Failed to spawn wt.exe: {}", e);
            format!("Failed to open Windows Terminal: {}", e)
        })?;

    Ok(())
}
