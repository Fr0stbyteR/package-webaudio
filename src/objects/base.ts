import { author, name, version, description } from "../index";
import { Bang, DefaultObject } from "../sdk";

export default class WebAudioObject<
    T extends AudioNode = AudioNode,
    S = {},
    I extends [Bang | any, ...any[]] = [Bang],
    O extends (null | any | T)[] = [],
    A extends any[] = any[],
    P = {}
> extends DefaultObject<{}, S, I, O, A, P> {
    static package = name;
    static icon = "volume up";
    static author = author;
    static version = version;
    static description = description;
    _: Partial<{ node: T }> & Record<string, any>;
    set node(nodeIn: T) {
        this._.node = nodeIn;
    }
    get node() {
        return this._.node;
    }
}
