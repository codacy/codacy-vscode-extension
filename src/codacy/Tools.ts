import { Api } from '../api'
import { Tool } from '../api/client'

export class Tools {
  static all: Tool[]

  static async init() {
    const { data: tools } = await Api.Tools.listTools()
    Tools.all = tools
  }

  static getTool(uuid: string) {
    return Tools.all.find((tool) => tool.uuid === uuid)
  }
}
