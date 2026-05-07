// services/schemaApi.js

import axios from "axios";

const BASE = "http://localhost:8080/api/schema";

export const getSchema = () =>
  axios.get(`${BASE}/efda`);

export const getOptions = (entity, params = {}) =>
  axios.get(`${BASE}/${entity}/options`, { params });