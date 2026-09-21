#!/usr/bin/env node

import { runStdioServer, bpmnTools } from "staruml-controller-mcp-core"

runStdioServer("staruml-controller-bpmn", "2.0.0", bpmnTools)
