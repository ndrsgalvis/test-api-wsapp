// const mysql = require("../config/mysql");

// const saveClient = async (data) => {
//   const { telefono, nombre } = data;
//   const query = `INSERT INTO clientes (telefono, nombre) VALUES (${mysql.escape(telefono)}, ${mysql.escape(nombre)})`;

//   try {
//     const [result] = await mysql.promise().query(query);
//     return result;
//   } catch (err) {
//     console.log("Error al guardar el cliente", err);
//     throw err;
//   }
// };

// const getClient = async (telefono) => {
//   const query = `SELECT * FROM clientes WHERE telefono = ${mysql.escape(telefono)}`;
//   try {
//     const [result] = await mysql.promise().query(query);
//     return result;
//   } catch (err) {
//     console.log("Error al obtener el cliente", err);
//     throw err;
//   }
// };

// const saveHistorial = async (data) => {
//   const { cliente_id, mensaje } = data;
//   const query = `INSERT INTO historial (cliente_id, mensaje) VALUES (${mysql.escape(cliente_id)}, ${mysql.escape(mensaje)})`;
//   try {
//     const [result] = await mysql.promise().query(query);
//     return result;
//   } catch (err) {
//     console.log("Error al guardar el historial", err);
//     throw err;
//   }
// };

// const verifyStoreClient = async (telefono, nombre, mensaje) => {
//   const client = await getClient(telefono);

//   if (!client.length) {
//     const savePayload = {
//       telefono,
//       nombre,
//     };

//     await saveClient(savePayload);
//   } else {
//     const historialPayload = {
//       cliente_id: client[0].id,
//       mensaje,
//     };
//     await saveHistorial(historialPayload);
//   }

//   return null;
// };

// module.exports = {
//   verifyStoreClient,
// };
