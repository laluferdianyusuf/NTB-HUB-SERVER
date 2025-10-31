import { Table } from "@prisma/client";
import { TableRepository } from "./../repositories/table.repo";

const tableRepository = new TableRepository();

export class TableServices {
  async createTable(data: Table, floorId: string) {
    try {
      const createdTable = await tableRepository.createNewTableByFloor(
        data,
        floorId
      );
      return {
        status: true,
        status_code: 201,
        message: "Table created successfully",
        data: createdTable,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getTableByFloorId(floorId: string) {
    try {
      const floors = await tableRepository.findTablesByFloor(floorId);
      return {
        status: true,
        status_code: 200,
        message: "floors retrieved",
        data: floors,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async getTableById(id: string) {
    try {
      const existing = await tableRepository.findTablesById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Floor not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Floor founded",
        data: existing,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async updateTable(id: string, data: Table) {
    try {
      const existing = await tableRepository.findTablesById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Table not found",
          data: null,
        };
      }

      const updated = await tableRepository.updateTable(id, data);

      return {
        status: true,
        status_code: 200,
        message: "Table updated",
        data: updated,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }

  async deleteTable(id: string) {
    try {
      const existing = await tableRepository.findTablesById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Table not found",
          data: null,
        };
      }

      const deleted = await tableRepository.deleteTable(id);

      return {
        status: true,
        status_code: 200,
        message: "Table deleted",
        data: deleted,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error",
        data: null,
      };
    }
  }
}
