const { request, response } = require('express'); //importamos variables req y res de express para las solicitudes HTTP
const GenshinModel = require('../models/users')//importamos modulo
const pool = require('../db');//conexión a la bd

//####################################################
//              ENDPOINT'S --> OPERACIONES CRUD
//################ MOSTRAR TODO ######################
const listCharacters = async (req = request, res = response) => { 
  let conn; //variable 'conn' que se usará para almacenar una conexión a la base de datos.

  try {
    conn = await pool.getConnection();
          //Ejecuta una consulta SQL en 'GenshinModel.getAll' usando 'conn' y almacena los resultados en 'rows'
    const rows = await conn.query(GenshinModel.getAll, (err) => {
      
      if (err) {
        throw err
      }
    });

    res.status(200).json({ characters: rows }); //devuelve la respuesta HTTP y envía los personajes obtenidos en formato JSON.
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  } finally {
    if (conn) conn.end();
  }
};


//#################### BUSQUEDA ESPECIFICA ####################
const nameSearch = async (req = request, res = response) => { 
  const { character_name } = req.query; //Extrae el parámetro 'character_name' de la consulta (query) de la solicitud HTTP

  if (!character_name) {//si no se ingresa parametro mandará un mensaje
    res.status(400).json({ msg: '--Invalid character name--' });
    return;
  }

  let conn;

  try {
    conn = await pool.getConnection();
//consulta SQL para obtener los nombres de los personajes utilizando 'GenshinModel.getByName' y almacena en 'characters'
    const [characters] = await conn.query(GenshinModel.getByName, [character_name]);

    // Verificar si se encontraron personajes.
    if (!characters || characters.length === 0) {
      res.status(404).json({ msg: `No characters found for the given name: ${character_name}` });
      return;
    }

    // Enviar la lista de personajes en formato JSON como respuesta exitosa.
    res.json({ msg: 'RESULT:', characters });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  } finally {
    if (conn) conn.end();
  }
};


//######################## AÑADIR #################################
const AddCharacter = async (req = request, res = response) => { 
  const { //Extrae los datos del nuevo personaje del body de la solicitud HTTP
      character_name,
      rarity,
      region,
      vision,
      weapon_type,
      model,
      constellation,
      birthday,
      release_date
  } = req.body;

  if (!character_name || !rarity || !region || !vision || !weapon_type || !model || !constellation || !birthday || !release_date) {
      res.status(400).json({ msg: 'Missing information' }); //si falta algún parametro manda el mensaje
      return;
  }

  const Character = [ //datos del personaje añadido
      character_name,
      rarity,
      region,
      vision,
      weapon_type,
      model,
      constellation,
      birthday,
      release_date
  ];

  let conn;

  try {
      conn = await pool.getConnection();

      const [characterName] = await conn.query(//Verifica si ya existe un personaje con el mismo nombre antes de agregarlo
          GenshinModel.getByCharacterName,
          [character_name],
          (err) => { if (err) throw err; }
      );

      if (characterName) {
          res.status(409).json({ msg: `Character with name ${character_name} already exists` });
          return;
      }
        //pasa los valores de Character a characterAdded
      const characterAdded = await conn.query(GenshinModel.addRow, [...Character], (err) => {
          if (err) throw err;
      });
        //si no se pudo afectar a nunguna fila manda error
      if (characterAdded.affectedRows === 0) {
          throw new Error({ message: 'Failed to add character' });
      }
        //Devuelve una respuesta JSON indicando que el personaje se ha agregado correctamente.
      res.json({ msg: 'Character added successfully' });
  } catch (error) {
      console.log(error);
      res.status(500).json(error);
  } finally {
      if (conn) conn.end();
  }
};

//########################### UPDATE ######################
const updateCharacter = async (req = request, res = response) => {
  let conn; //variable 'conn' para almacenar una conexión a la bd

  //Extrae el parámetro 'character_name' de la solicitud HTTP
  const { character_name } = req.params; 

  const { //Extrae los datos actualizados del personaje del body
      rarity,
      region,
      vision,
      weapon_type,
      model,
      constellation,
      birthday,
      release_date
  } = req.body;

  let character = [ //arreglo 'character' con los datos actualizados del personaje.
    rarity,
    region,
    vision,
    weapon_type,
    model,
    constellation,
    birthday,
    release_date
  ];

  try {
      conn = await pool.getConnection(); // conexión a la base de datos utilizando el objeto 'pool

      //verificar si el personaje con el nombre proporcionado existe.
      const [characterExists] = await conn.query(
          GenshinModel.getByName,
          [character_name],
          (err) => { throw err; }
      );

      //Si el personaje no existe, devuelve un mensaje indicando que el personaje no se encontró
      if (!characterExists) {
          res.status(404).json({ msg: '--Character not found--' });
          return;
      }

      //Verifica si la constelación proporcionada ya existe para evitar duplicados.
      if (constellation === characterExists.constellation) { //si es extrictamente igual a una que ya existe
        res.status(409).json({ msg: `constellation '${constellation}' already exists` });
        return;
      }
          //arreglo 'oldCharacter
      let oldCharacter = [ //muestra los datos actuales del personaje antes de la actualización
          characterExists.character_name,
          characterExists.rarity,
          characterExists.region,
          characterExists.vision,
          characterExists.weapon_type,
          characterExists.model,
          characterExists.constellation,
          characterExists.birthday,
          characterExists.release_date
      ];

      //Reemplaza los datos actualizados con los datos antiguos si los datos actualizados son nulos
      character.forEach((characterData, index) => {
          if (!characterData) {
              character[index] = oldCharacter[index];
          }
      });

      //consulta SQL para actualizar el personaje con los datos proporcionados
      const characterUpdated = await conn.query(GenshinModel.updateCharacter, [...character, character_name], (err) => {
          if (err) throw err;
      });

      //Si la consulta no afecta ninguna fila, se lanza un error indicando que el personaje no se actualizó.
      if (characterUpdated.affectedRows === 0) {
          throw new Error('Character not updated');
      }

      //respuesta JSON indicando que el personaje se ha actualizado correctamente
      res.json({ msg: 'Character updated successfully', ...oldCharacter });
  } catch (error) {
      res.status(409).json(error);
      return;
  } finally {
      if (conn) conn.end();
  }
};

//########################### DELETE ######################
const deletecharacter = async (req = request, res = response) => {
  let conn; //variable 'conn' que se utilizará para almacenar una conexión a la bd
  const { character_name } = req.params; // Cambiado a character_name según el campo que se 
                                         //quiera usar pero tambien se debe cambiar el de buscar

  try { //bloque try donde se da la conexión a la base de datos desde el objeto 'pool'
      conn = await pool.getConnection();

        // verifica si el personaje con el nombre proporcionado existe
      const [characterExists] = await conn.query(
          GenshinModel.getByName,
          [character_name]
      );

      //Si el personaje no existe, devuelve un mensaje y termina de ejecutar
      if (!characterExists) {
          res.status(404).json({ msg: 'Character not found' });
          return;
      }

      //consulta SQL para eliminar el personaje con el nombre proporcionado.
      const characterDelete = await conn.query(
          GenshinModel.deleteRow,
          [character_name]
      );

      //si no afecta a ninguna fila, lanza error indicando el fallo
      if (characterDelete.affectedRows === 0) {
          throw new Error({ msg: 'Failed to delete character' });
      }

      //respuesta JSON indicando que el personaje se ha eliminado correctamente.
      res.json({ msg: 'Character deleted successfully' });

      //Captura cualquier error que ocurra dentro del try y maneja la respuesta en caso de error.
  } catch (error) {
      console.log(error);
      res.status(500).json(error);

      //Finally para asegurar que la conexión a la base de datos se cierre correctamente.
  } finally {
      if (conn) conn.end();
  }
};


//########################################################
module.exports = { //Exporta las funciones definidas
  listCharacters,
  nameSearch,
  AddCharacter,
  updateCharacter , 
  deletecharacter
  
};
