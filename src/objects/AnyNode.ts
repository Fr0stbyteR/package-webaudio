import WebAudioObject from "./base";
import type { IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export default class AnyNode extends WebAudioObject<AudioNode, {}, [AudioNode, ...null[]], null[]> {
    static description = "WebAudio AudioNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, AudioNode instance to set the node."
    }, {
        isHot: false,
        type: "signal",
        description: "Node connection"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection"
    }];
    _ = { node: undefined as AudioNode };
    handleInlet = ({ data, inlet }: { data: any; inlet: number }) => {
        if (inlet === 0) {
            try {
                if (data instanceof AudioNode) {
                    this.disconnectAudio();
                    this._.node = data;
                    const inlets = this.node.numberOfInputs || 1;
                    const outlets = this.node.numberOfOutputs;
                    const factoryMeta = AnyNode.meta as this["meta"];
                    const inlet0 = factoryMeta.inlets[0];
                    const inlet1 = factoryMeta.inlets[1];
                    const outlet0 = factoryMeta.inlets[0];
                    this.inletAudioConnections = [{ node: this.node, index: 0 }];
                    factoryMeta.inlets = [inlet0];
                    for (let i = 1; i < inlets; i++) {
                        factoryMeta.inlets[i] = inlet1;
                    }
                    for (let i = 0; i < outlets; i++) {
                        factoryMeta.outlets[i] = outlet0;
                    }
                    for (let i = 0; i < this.node.numberOfInputs; i++) {
                        this.inletAudioConnections[i] = { node: this.node, index: i };
                    }
                    for (let i = 0; i < this.node.numberOfOutputs; i++) {
                        this.outletAudioConnections[i] = { node: this.node, index: i };
                    }
                    this.setMeta(factoryMeta);
                    this.inlets = inlets;
                    this.outlets = outlets;
                    this.connectAudio();
                }
            } catch (e) {
                this.error((e as Error).message);
                return this;
            }
        }
        return this;
    };
    subscribe() {
        super.subscribe();
        this.on("inlet", this.handleInlet);
    }
}
