const { Router } = require('express')

const {
    listCharacters,updateCharacter, AddCharacter, nameSearch,deletecharacter
    
} = require('../controllers/users');

const router = Router();

// Rutas
router.get('/', listCharacters);
router.get('/:name', nameSearch); 
router.put('/', AddCharacter);
router.patch('/:character_name', updateCharacter);
router.delete('/:character_name', deletecharacter);


module.exports = router;
