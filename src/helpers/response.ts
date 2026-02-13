interface ResponsePayload<T = any> {
  status: boolean;
  status_code?: number;
  message: string;
  data?: T;
}

export const sendSuccess = <T = any>(
  res: any,
  data: T,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    status: true,
    message,
    data,
  } as ResponsePayload<T>);
};

export const sendError = (
  res: any,
  message = "Error",
  statusCode = 400,
  data: any = null,
) => {
  return res.status(statusCode).json({
    status: false,
    message,
  });
};
