import { Booking, Invoice, Table } from "@prisma/client";
import { TableRepository } from "./../repositories/table.repo";
import { uploadToCloudinary } from "utils/image";
import { error, success } from "helpers/return";
import { VenueRepository } from "repositories";
import { parseLocalToUTC, toLocalDBTime } from "helpers/formatIsoDate";

const tableRepository = new TableRepository();
const venueRepository = new VenueRepository();

export class TableServices {
  async createTable(data: Table, file?: Express.Multer.File) {
    const payload = {
      ...data,
      tableNumber: Number(data.tableNumber),
      price: Number(data.price),
    };

    try {
      const table = await tableRepository.findTablesByNumber(
        payload.tableNumber
      );
      if (table)
        return error.error400(
          `Table number ${table.tableNumber} has been added`
        );

      let imageUrl: string | null = null;
      if (file?.path) {
        imageUrl = await uploadToCloudinary(file.path, "tables");
      }

      const createdTable = await tableRepository.createNewTableByFloor({
        ...payload,
        image: imageUrl,
      });

      return success.success201("Table created successfully", createdTable);
    } catch (err) {
      return error.error500("Internal server error: " + err);
    }
  }

  async getTableByFloorId(floorId: string, venueId: string) {
    try {
      const tables = await tableRepository.findTablesByFloor(floorId, venueId);

      return success.success200("Tables retrieved", tables);
    } catch (err) {
      return error.error500("Internal server error: " + err);
    }
  }

  async getTableById(id: string) {
    try {
      const existing = await tableRepository.findTablesById(id);

      if (!existing) {
        return error.error404("Table not found");
      }

      return success.success200("Table retrieved", existing);
    } catch (err) {
      return error.error500("Internal server error: " + err);
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
        return error.error404("Table not found");
      }

      if (imageUrl) {
        data.image = imageUrl;
      }

      const updated = await tableRepository.updateTable(id, {
        ...data,
        image: imageUrl,
      });

      return success.success200("Tables updated", updated);
    } catch (err) {
      return error.error500("Internal server error: " + err);
    }
  }

  async deleteTable(id: string) {
    try {
      const existing = await tableRepository.findTablesById(id);

      if (!existing) {
        return error.error404("Table not found");
      }

      const deleted = await tableRepository.deleteTable(id);

      return success.success200("Tables deleted", deleted);
    } catch (err) {
      return error.error500("Internal server error: " + err);
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
    floorId: string,
    date: string,
    start: string,
    end: string
  ) {
    try {
      if (!venueId || !date || !start || !end) {
        return error.error400("Missing required query parameters");
      }

      const userStartLocal = new Date(`${date}T${start}:00`);
      const userEndLocal = new Date(`${date}T${end}:00`);

      const userStartUTC = new Date(
        userStartLocal.getTime() - userStartLocal.getTimezoneOffset() * 60000
      );
      const userEndUTC = new Date(
        userEndLocal.getTime() - userEndLocal.getTimezoneOffset() * 60000
      );

      const now = new Date();

      const tables = await tableRepository.findTablesByFloor(floorId, venueId);

      const result = tables.map((table: any) => {
        const isBooked = table.bookings?.some((b: any) => {
          const invoice: Invoice = b.invoice;

          if (!invoice) return false;

          const isInvoiceValid =
            invoice.status === "PAID" ||
            (invoice.status === "PENDING" &&
              invoice.expiredAt &&
              new Date(invoice.expiredAt) > now);

          if (!isInvoiceValid) return false;

          const bookingStart = new Date(b.startTime);
          const bookingEnd = new Date(b.endTime);

          return userStartUTC < bookingEnd && userEndUTC > bookingStart;
        });

        return { ...table, isBooked: !!isBooked };
      });

      return success.success200("Tables available", result);
    } catch (err) {
      return error.error500("Internal server error: " + err);
    }
  }
}
