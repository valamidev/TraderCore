// Used for Tensorflow service communication
// TODO: Use Websocket

const axios = require('axios');

export const mlAPI = {
  predict: async (input: any, name: any) => {
    let result = [0, 0];

    let predict = await axios.post('http://localhost:3000/' + name + '/predict', {
      input,
    });

    if (predict) {
      result = predict.data;
    }

    return result;
  },
};
