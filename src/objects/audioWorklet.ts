import { Bang, isBang, DefaultObject } from "../sdk";
import type { IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export default class audioWorklet extends DefaultObject<{}, {}, [Bang, string], [AudioWorklet, Bang]> {
    static description = "Get currrent patcher's audio worklet from context";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "bang",
        description: "Output current audio worklet"
    }, {
        isHot: true,
        type: "string",
        description: "Code to add as module"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "Current audio worklet"
    }, {
        type: "bang",
        description: "Output a bang while module is added"
    }];
    audioWorklet: AudioWorklet;
    handleInlet: (e: { data: any; inlet: number }) => Promise<void> = async ({ data, inlet }) => {
        if (inlet === 0) {
            if (isBang(data)) this.outlet(0, this.audioWorklet);
        } else if (inlet === 1) {
            if (typeof data === "string") {
                try {
                    const url = window.URL.createObjectURL(new Blob([data], { type: "text/javascript" }));
                    await this.audioWorklet.addModule(url);
                    this.outlet(1, new Bang());
                } catch (e) {
                    this.error((e as Error).message);
                }
            }
        }
    };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 2;
            if (!this.patcher.audioCtx.audioWorklet) this.error("AudioWorklet not found.");
            else this.audioWorklet = this.patcher.audioCtx.audioWorklet;
        });
        this.on("inlet", this.handleInlet);
    }
}
