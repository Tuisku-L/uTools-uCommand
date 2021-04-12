interface ListLine {
    title: string;
    description: string;
    icon?: string;
    customType?: CustomType;
    res?: "cmd" | "pws";
};

enum CustomType {
    Setting = 1,
    Exec = 2
};

interface HistoryCommand extends utools.db.DbObject {
    command: string;
    createTime: number;
}
