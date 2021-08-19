import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import { isNumberArray } from "@jspatcher/jspatcher/src/utils/utils";
import type { IInletsMeta, IOutletsMeta, IArgsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

type I = [Bang, number[], number[]];
type A = [number[], number[]];

export default class IIRFilter extends WebAudioObject<IIRFilterNode, { feedforward: number[]; feedback: number[] }, I, [null, IIRFilterNode], A, {}> {
    static description = "WebAudio IIRFilterNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection (1 channel), bang to output IIRFilterNode instance"
    }, {
        isHot: false,
        type: "object",
        description: "feedforward, A sequence of coefficients, change will reconstruct the node: number[]"
    }, {
        isHot: false,
        type: "object",
        description: "feedback, A sequence of coefficients, change will reconstruct the node: number[]"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection (1 channel)"
    }, {
        type: "object",
        description: "Instance: IIRFilterNode"
    }];
    static args: IArgsMeta = [{
        type: "object",
        optional: false,
        default: [],
        description: "feedforward, A sequence of coefficients: number[]"
    }, {
        type: "object",
        optional: false,
        default: [],
        description: "feedback, A sequence of coefficients: number[]"
    }];
    _ = { node: undefined as IIRFilterNode, feedforward: [] as number[], feedback: [] as number[] };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 3;
            this.outlets = 2;
            handleArgs(this.args);
        });
        const handleArgs = (args: Partial<A>) => {
            if (isNumberArray(args[0])) this._.feedforward = args[0];
            if (isNumberArray(args[1])) this._.feedback = args[1];
            this.resetNode();
        }
        this.on("updateArgs", handleArgs);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) this.outlet(1, this.node);
            } else if (inlet === 1) {
                if (isNumberArray(data)) this._.feedforward = data;
                this.resetNode();
            } else if (inlet === 2) {
                if (isNumberArray(data)) this._.feedback = data;
                this.resetNode();
            }
        });
    }
    resetNode() {
        this.disconnectAudio();
        this.node = this.audioCtx.createIIRFilter(this._.feedforward, this._.feedback);
        this.node.channelInterpretation = "discrete";
        this.inletAudioConnections[0] = { node: this.node, index: 0 };
        this.outletAudioConnections[0] = { node: this.node, index: 0 };
        this.connectAudio();
    }
}
