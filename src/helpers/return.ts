export const error = {
  error400(message: string) {
    return {
      status: false,
      status_code: 400,
      message: message,
      data: null,
    };
  },

  error404(message: string) {
    return {
      status: false,
      status_code: 404,
      message: message,
      data: null,
    };
  },

  error500(message: string) {
    return {
      status: false,
      status_code: 500,
      message: message,
      data: null,
    };
  },
};

export const success = {
  success201(message: string, data: any) {
    return {
      status: true,
      status_code: 201,
      message: message,
      data: data,
    };
  },
  success200(message: string, data: any) {
    return {
      status: true,
      status_code: 200,
      message: message,
      data: data,
    };
  },
};
