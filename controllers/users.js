const { request, response } = require('express');
const GenshinModel = require('../models/users')
const pool = require('../db');

//####################################################
//              ENDPOINT'S --> OPERACIONES CRUD
//################ MOSTRAR TODO ######################
const listCharacters = async (req = request, res = response) => {
  let conn;

  try {
    conn = await pool.getConnection();

    const rows = await conn.query(GenshinModel.getAll, (err) => {
      
      if (err) {
        throw err
      }
    });

    res.status(200).json({ characters: rows });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  } finally {
    if (conn) conn.end();
  }
};



//#################### BUSQUEDA ESPECIFICA ####################
const nameSearch = async (req = request, res = response) => {
  const { character_name } = req.query;

  if (!character_name) {
    res.status(400).json({ msg: '--Invalid character name--' });
    return;
  }

  let conn;

  try {
    conn = await pool.getConnection();

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
  const {
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
      res.status(400).json({ msg: 'Missing information' });
      return;
  }

  const Character = [
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

      const [characterName] = await conn.query(
          GenshinModel.getByCharacterName,
          [character_name],
          (err) => { if (err) throw err; }
      );

      if (characterName) {
          res.status(409).json({ msg: `Character with name ${character_name} already exists` });
          return;
      }

      const characterAdded = await conn.query(GenshinModel.addRow, [...Character], (err) => {
          if (err) throw err;
      });

      if (characterAdded.affectedRows === 0) {
          throw new Error({ message: 'Failed to add character' });
      }

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
  let conn;

  const { character_name } = req.params; 

  const {
      rarity,
      region,
      vision,
      weapon_type,
      model,
      constellation,
      birthday,
      release_date
  } = req.body;

  let character = [
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
      conn = await pool.getConnection();

      const [characterExists] = await conn.query(
          GenshinModel.getByName,
          [character_name],
          (err) => { throw err; }
      );

      if (!characterExists) {
          res.status(404).json({ msg: '--Character not found--' });
          return;
      }

      
      if (constellation === characterExists.constellation) {
        res.status(409).json({ msg: `constellation '${constellation}' already exists` });
        return;
      }

      let oldCharacter = [
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

      character.forEach((characterData, index) => {
          if (!characterData) {
              character[index] = oldCharacter[index];
          }
      });

      const characterUpdated = await conn.query(GenshinModel.updateCharacter, [...character, character_name], (err) => {
          if (err) throw err;
      });

      if (characterUpdated.affectedRows === 0) {
          throw new Error('Character not updated');
      }

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
  let conn;
  const { character_name } = req.params; // Cambiado a character_name según el campo que se 
                                         //quiera usar pero tambien se debe cambiar el de buscar

  try {
      conn = await pool.getConnection();

      const [characterExists] = await conn.query(
          GenshinModel.getByName,
          [character_name]
      );

      if (!characterExists) {
          res.status(404).json({ msg: 'Character not found' });
          return;
      }

      const characterDelete = await conn.query(
          GenshinModel.deleteRow,
          [character_name]
      );

      if (characterDelete.affectedRows === 0) {
          throw new Error({ msg: 'Failed to delete character' });
      }

      res.json({ msg: 'Character deleted successfully' });

  } catch (error) {
      console.log(error);
      res.status(500).json(error);
  } finally {
      if (conn) conn.end();
  }
};


//########################################################
module.exports = {
  listCharacters,
  nameSearch,
  AddCharacter,
  updateCharacter , 
  deletecharacter
  
};
