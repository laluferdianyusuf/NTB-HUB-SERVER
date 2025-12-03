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
      status_code: 400,
      message: message,
      data: null,
    };
  },

  error500(message: string) {
    return {
      status: false,
      status_code: 400,
      message: message,
      data: null,
    };
  },
};

export const success = {
  success201(message: string, data: any) {
    return {
      status: false,
      status_code: 400,
      message: message,
      data: data,
    };
  },
};
