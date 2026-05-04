type TrackData = {
  type: string;
  id: string;
  ref?: string;
  userAgent?: string;
  ip?: string;
};

export class TrackingService {
  static trackClick(data: TrackData) {
    console.log("TRACK CLICK:", data);

    // simpan ke DB
    // prisma.click.create({ data })
  }
}
