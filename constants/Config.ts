const development = {
  IS_DEV_MODE: true,
  API_HOST: "https://haengwoonsaju.com",
  API_SECRET: "8f4e2c1d9b7a3f5e8c2d4b6a9f1e3d5b7c4a2e6f8d0b5a3c7e9f1d4b2a6c8e0",
};

const production = {
  IS_DEV_MODE: false,
  API_HOST: "http://52.79.119.109",
  API_SECRET: "8f4e2c1d9b7a3f5e8c2d4b6a9f1e3d5b7c4a2e6f8d0b5a3c7e9f1d4b2a6c8e0",
};

const getEnvVars = () => {
  if (__DEV__) {
    return development;
  }
  return production;
};

export default getEnvVars();
