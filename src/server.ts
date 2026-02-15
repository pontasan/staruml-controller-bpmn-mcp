import { createServer, bpmnTools } from "staruml-controller-mcp-core"

export function createBpmnServer() {
    return createServer("staruml-controller-bpmn", "1.0.0", bpmnTools)
}
