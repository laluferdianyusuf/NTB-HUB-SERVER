import { Table } from "@prisma/client";
import { TableRepository } from "./../repositories/table.repo";
import { uploadToCloudinary } from "utils/image";
import { error, success } from "helpers/return";
import { VenueRepository } from "repositories";

const tableRepository = new TableRepository();
const venueRepository = new VenueRepository();

export class TableServices {
  async createTable(data: Table, floorId: string, file?: Express.Multer.File) {
    try {
      let imageUrl: string | null = null;

      if (file && file.path) {
        imageUrl = await uploadToCloudinary(file.path, "tables");
      }

      const createdTable = await tableRepository.createNewTableByFloor(
        { ...data, tableNumber: Number(data.tableNumber), image: imageUrl },
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

  async getTableByFloorId(floorId: string, venueId: string) {
    try {
      const tables = await tableRepository.findTablesByFloor(floorId, venueId);

      return {
        status: true,
        status_code: 200,
        message: "tables retrieved",
        data: tables,
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

  async updateTable(id: string, data: Table, file: Express.Multer.File) {
    try {
      let imageUrl: string | null = null;

      if (file && file.path) {
        imageUrl = await uploadToCloudinary(file.path, "tables");
      }

      const existing = await tableRepository.findTablesById(id);

      if (!existing) {
        return {
          status: false,
          status_code: 404,
          message: "Table not found",
          data: null,
        };
      }

      if (imageUrl) {
        data.image = imageUrl;
      }

      const updated = await tableRepository.updateTable(id, {
        ...data,
        image: imageUrl,
      });

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

  async getTablesStatus(id: string) {
    try {
      const table = await tableRepository.getTableStatus(id);

      if (!table) {
        return error.error404("Table not found");
      }

      return success.success200("Table retrieved successful", table);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  async findAvailableTables(
    venueId: string,
    date: string,
    start: string,
    end: string
  ) {
    try {
      if (!venueId || !date || !start || !end) {
        return error.error400("Missing required query parameters");
      }

      const startTime = new Date(`${date}T${start}`);
      const endTime = new Date(`${date}T${end}`);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return error.error400("Invalid date or time format");
      }

      const result = await tableRepository.findAvailableTables(
        venueId,
        startTime,
        endTime
      );

      return success.success200("Tables available", result);
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }
}
