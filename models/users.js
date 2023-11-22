const Genshinmodel = {
  // Obtener todos los registros de la tabla 'fifa'
  getAll: `
  SELECT 
  * 
FROM 
    genshin`
  ,
 
    getByName: `
    SELECT *
    FROM  
        genshin
    WHERE 
        character_name
     LIKE CONCAT('%', ?, '%')
`,
getByCharacterName: `
    SELECT 
    * 
    FROM
        genshin
    WHERE character_name = ?
    `,
    addRow: `
  INSERT INTO genshin (
    character_name,
    rarity,
    region,
    vision,
    weapon_type,
    model,
    constellation,
    birthday,
    release_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
updateCharacter: `
  UPDATE
     genshin
  SET 
  
    rarity = ?,
    region = ?, 
    vision = ?, 
    weapon_type = ?,
    model = ?,
    constellation = ?,
    birthday = ?,
    release_date = ?
  WHERE character_name = ?
`,


deleteRow:`DELETE 
FROM 
    genshin
 WHERE  character_name = ?`, //id
getConstellatio:
`  SELECT 
    * 
    FROM
        genshin
    WHERE constellation = ?
    `
    }
module.exports = Genshinmodel;