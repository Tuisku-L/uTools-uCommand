const child_process = require("child_process");

window.exports = {
    "#": {
        mode: "list",
        args: {
            enter: (action, setList) => {
                const history = getHistoryCommand();
                const list = history.map((cmd => {
                    return {
                        title: cmd.command,
                        description: new Date(cmd.createTime).toLocaleString()
                    };
                }));
                setList(list);
            },
            search: (action, searchWord: string, setList: (list: Array<ListLine>) => void) => {
                if (searchWord.toLowerCase() === "终端设置") {
                    setList([
                        {
                            title: "CMD",
                            description: "使用 CMD 执行命令",
                            customType: CustomType.Setting,
                            res: "cmd"
                        },
                        {
                            title: "PowerShell",
                            description: "使用 PowerSehll 执行命令",
                            customType: CustomType.Setting,
                            res: "pws"
                        }
                    ])
                } else {
                    const history = getHistoryCommand();
                    const list = history.filter((cmd: HistoryCommand) => cmd.command.includes(searchWord)).map((cmd => {
                        return {
                            title: cmd.command,
                            description: new Date(cmd.createTime).toLocaleString()
                        };
                    }));
                    if (list.length > 0) {
                        setList(list);
                    } else {
                        setList([{
                            title: searchWord,
                            description: "立即执行",
                            customType: CustomType.Exec
                        }]);
                    }
                }
            },
            select: (action, itemData: ListLine, setList: (list: Array<ListLine>) => void) => {
                if (itemData.customType === CustomType.Setting) {
                    // 设置终端类型
                    setExecType(itemData.res);
                    // 清除子输入框
                    window.utools.setSubInputValue("");
                    setList([]);
                } else {
                    insertHistoryCommand(itemData.title);
                    execCommand(itemData.title, false);
                }
            },
            placeholder: "输入命令并回车以执行"
        }
    }
};

function getHistoryCommand() {
    let result = window.utools.db.allDocs<HistoryCommand>("cmd|history");
    result = result.sort((a: HistoryCommand, b: HistoryCommand) => {
        return a.createTime < b.createTime ? 1 : -1
    });

    return result;
};

function insertHistoryCommand(command: string): void {
    const obj: HistoryCommand = {
        _id: `cmd|history|${Date.now()}`,
        command,
        createTime: Date.now()
    };

    window.utools.db.put(obj);
};

function getExecType(): "cmd" | "pws" {
    const result = utools.db.get("exec_type");

    if (!result) {
        utools.db.put({
            _id: "exec_type",
            type: "cmd"
        });
    }

    return result ? result.type : "cmd";
};

function setExecType(type: "cmd" | "pws") {
    const result = utools.db.get("exec_type");
    result.type = type;
    const changeResult = utools.db.put(result);
    return changeResult.ok;
};

function execCommand(command: string, hideWindow: boolean = false): void {
    const execType = getExecType();

    const shell = hideWindow ?
        command : `cmd.exe /k start ${execType === "cmd" ? `cmd.exe /k ${command}` : `PowerShell -NoExit -Command "${command}"`}`

    const exec = child_process.exec(shell);

    exec.stderr.on("data", (data: any) => {
        console.info("err: " + data);
        utools.showNotification(`无法执行命令: ${data}`);
    });
};