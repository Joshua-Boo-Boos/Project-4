# Import all requires modules
from fastapi import FastAPI, Response, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
import aiosqlite
from contextlib import asynccontextmanager
import json
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext

# Define JWT related variables
SECRET_KEY = "%$^%U$P$$Ph4hk4o4okhtoh4por4%J$Jyjyj5yrj4y456457rtRYJYRTJOJ%J5p5p[46mk4646jojo46jom46j$^J$J]"
ALGORITHM = "HS256"
ACCES_TOKEN_EXPIRE_MINUTES = 15

def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=ACCES_TOKEN_EXPIRE_MINUTES)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Define pydantic objects
class RecipeObject(BaseModel):
    username: str
    recipe_id: int
    recipe_title: str
    recipe_description: str

class UserCredentialsObject(BaseModel):
    username: str
    password: str

class UsernameObj(BaseModel):
    username: str

class UsernameAndIDToFavourite(BaseModel):
    username: str
    recipe_id_to_favourite: int

class UsernameAndIDToUnfavourite(BaseModel):
    username: str
    recipe_id_to_unfavourite: int

class UsernameAndIDToDelete(BaseModel):
    username: str
    recipe_id: str

# Define asynchronous aiosqlite database initialisation function
async def init_db():
    async with aiosqlite.connect('users.db') as db:
        await db.execute('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT NOT NULL)')
        await db.commit()
    async with aiosqlite.connect('posts.db') as db:
        await db.execute('CREATE TABLE IF NOT EXISTS posts (username TEXT PRIMARY KEY, post_data TEXT NOT NULL DEFAULT \'[]\')')
        await db.commit()
    async with aiosqlite.connect('favourites.db') as db:
        await db.execute("CREATE TABLE IF NOT EXISTS favourites (username TEXT PRIMARY KEY, ids TEXT NOT NULL DEFAULT '[]')")
        await db.commit()

# Use asynchronous context manager to define the lifespan
# function resulting in the database initialisation upon
# backend startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

# Define the app as a FastAPI object and providing the lifespan parameter
app = FastAPI(lifespan=lifespan)

# Add CORS middleware to ensure cross-origin requests are handled and SSL is enabled
app.add_middleware(CORSMiddleware,
                   allow_origins=['https://localhost'],
                   allow_credentials=True,
                   allow_methods=['*'],
                   allow_headers=['*'])

# Define API routes
@app.get('/api/verify-auth')
async def verify_authentication(request: Request):
    token = request.cookies.get('access_token')
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail='Invalid token - No username found')
        return {"username": username}
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid token - JWTError')

@app.post('/api/token') # Login route
async def login_for_access_token(response: Response, user_credentials_obj: UserCredentialsObject):
    async with aiosqlite.connect('users.db') as db:
        username = user_credentials_obj.username
        password = user_credentials_obj.password
        cur = await db.execute('SELECT * FROM users WHERE username = ?', (username,))
        result = await cur.fetchone()
        if result:
            if password == result[1]:
                access_token = create_access_token(data={"sub": username})
                response.set_cookie(
                    key="access_token",
                    value=access_token,
                    httponly=True,
                    secure=True,
                    samesite="lax"
                )
                return {"success": True}
            else:
                raise HTTPException(status_code=401, detail='Incorrect password')
        else:
            raise HTTPException(status_code=400, detail='User not found')

@app.get('/api/retrieveAllRecipes')
async def get_all_recipes():
    async with aiosqlite.connect('posts.db') as db:
        await db.execute('CREATE TABLE IF NOT EXISTS posts (username TEXT PRIMARY KEY, post_data TEXT NOT NULL DEFAULT \'[]\')')
        await db.commit()
        try:
            cur = await db.execute('SELECT post_data FROM posts')
            result = await cur.fetchone()
            print('result:', result)
            if result:
                json_posts_list = result[0]
                return {'success': True, 'recipes': json_posts_list}
            else:
                return {'success': True, 'recipes': '[]'}
        except aiosqlite.Error as e:
            print(f'aiosqlite.Error getting all recipes: {e}')
            raise HTTPException(status_code=500, detail='Exception obtaining all posts from database')
        except Exception as ex:
            print(f'Other exception getting all recipes: {ex}')
            raise HTTPException(status_code=500, detail='Exception unrelated to aiosqlite.Error exception')    

@app.get('/api/getRecipeInformation/{recipeId}')
async def get_specific_recipe(recipeId: str):
    async with aiosqlite.connect('posts.db') as db:
        await db.execute('CREATE TABLE IF NOT EXISTS posts (username TEXT PRIMARY KEY, post_data TEXT NOT NULL DEFAULT \'[]\')')
        await db.commit()
        try:
            cur = await db.execute('SELECT post_data FROM posts')
            all_post_json_string_tuple = await cur.fetchone()
            print('tuple of post_data?', all_post_json_string_tuple)
            if all_post_json_string_tuple:
                all_post_data_json_string = all_post_json_string_tuple[0]
                all_post_data_list = json.loads(all_post_data_json_string)
                if all_post_data_list:
                    for post_entry in all_post_data_list:
                        if post_entry[0] == recipeId:
                            json_result_to_return = json.dumps(post_entry)
                            return {'success': True, 'recipe_data': json_result_to_return}
        except aiosqlite.Error as e:
            print(f'Database related error getting specific recipe information: {e}')
            raise HTTPException(status_code=500, detail='Database error receiving specific recipe information')
        except Exception as ex:
            print(f'Non-database related error getting specific recipe information: {ex}')
            raise HTTPException(status_code=500, detail='Non-database related error receiving specific recipe information')

@app.post('/api/deleteRecipe')
async def delete_specific_recipe(username_id_delete_obj: UsernameAndIDToDelete):
    async with aiosqlite.connect('posts.db') as db:
        try:
            username = username_id_delete_obj.username
            recipe_id = username_id_delete_obj.recipe_id
            cur = await db.execute('SELECT * FROM posts WHERE username = ?', (username,))
            result = await cur.fetchone()
            print(f'result is: {result}')
            if result:
                json_posts_string = result[1]
                posts_obj = json.loads(json_posts_string)
                new_posts_obj = []
                for post in posts_obj:
                    if post[0] != recipe_id:
                        new_posts_obj.append(post)
                new_posts_json_string = json.dumps(new_posts_obj)
                await db.execute('UPDATE posts SET post_data = ? WHERE username = ?', (new_posts_json_string, username))
                await db.commit()
                return {'success': True}
            else:
                print('result is none')
                raise HTTPException(status_code=400, detail='User has no posts')
        except aiosqlite.Error as e:
            print(f'Error removing recipe from database: {e}')
            raise HTTPException(status_code=500, detail='Database error removing recipe from database {e}')
        except Exception as ex:
            print(f'Non-database error removing recipe from database: {ex}')
            raise HTTPException(status_code=500, detail='Non-database error removing recipe from database {ex}')

@app.get('/api/{username}/recipes')
async def get_user_recipes(username: str):
    async with aiosqlite.connect('posts.db') as db:
        try:
            cur = await db.execute('SELECT * FROM posts WHERE username = ?', (username,))
            result = await cur.fetchone()
            print('result:', result)
            if result:
                json_posts_string = result[1]
                print('json_posts_string:', json_posts_string)
                return {'recipesString': json_posts_string}
            else:
                return {'recipesString': '[]'}
        except aiosqlite.Error as e:
            raise HTTPException(status_code=400, detail=f'Bad request to the database: {e}')
        except Exception as ex:
            raise HTTPException(status_code=500, detail=f'Exception occured: {ex}')

@app.post('/api/getFavouriteRecipes')
async def get_favourite_recipes(username_obj: UsernameObj):
    async with aiosqlite.connect('favourites.db') as db:
        await db.execute("CREATE TABLE IF NOT EXISTS favourites (username TEXT PRIMARY KEY, ids TEXT NOT NULL DEFAULT '[]')")
        await db.commit()
        try:
            username = username_obj.username
            cur = await db.execute('SELECT * FROM favourites WHERE username = ?', (username,))
            table_data = await cur.fetchone()
            if table_data:
                ids = json.loads(table_data[1])
                print(f'getFavouritesRecipes - ids: {ids}')
                if ids:
                    json_ids = json.dumps(ids)
                    return {'success': True, 'favourite_recipe_ids': json_ids}
                else:
                    return {'success': True, 'favourite_recipe_ids': '[]'}
            else:
                await db.execute('INSERT INTO favourites VALUES (?,?)', (username, '[]'))
                await db.commit()
                return {'success': True, 'favourite_recipe_ids': '[]'}
        except aiosqlite.Error as e:
            print(f'Error getting favourite recipes by username: {username} - Database error: {e}')
            raise HTTPException(status_code=500, detail='Error getting favourite recipes - Database error')
        except Exception as ex:
            print(f'Error getting favourite recipes by username {username} - Non-database error: {ex}')
            raise HTTPException(status_code=500, detail='Error getting favourite recipes - Non-database error')

@app.post('/api/addToFavourites')
async def add_to_favourites(username_and_recipe_id_to_favourite: UsernameAndIDToFavourite):
    async with aiosqlite.connect('favourites.db') as db:
        await db.execute("CREATE TABLE IF NOT EXISTS favourites (username TEXT PRIMARY KEY, ids TEXT NOT NULL DEFAULT '[]')")
        await db.commit()
        try:
            username = username_and_recipe_id_to_favourite.username
            recipe_id = username_and_recipe_id_to_favourite.recipe_id_to_favourite
            cur = await db.execute('SELECT * FROM favourites WHERE username = ?', (username,))
            favourite_id_string_db_tuple = await cur.fetchone()
            print(f'favourite_id_string: {favourite_id_string_db_tuple}')
            if favourite_id_string_db_tuple is not None:
                favourite_id_string = json.loads(favourite_id_string_db_tuple[1])
                if favourite_id_string.count(str(recipe_id)) > 0:
                    raise HTTPException(status_code=400, detail='Recipe is already a favourite')
                else:
                    favourite_id_string.append(str(recipe_id))
                    print(f'favourite_id_string now: {favourite_id_string}')
                    new_favourite_id_string = json.dumps(favourite_id_string)
                    print(f'new_favourite_id_string as json: {new_favourite_id_string}')
                    await db.execute('UPDATE favourites SET ids = ? WHERE username = ?', (new_favourite_id_string, username))
                    await db.commit()
                    return {'success': True, 'current_favourites': new_favourite_id_string}
            else:
                new_favourites_list = [str(recipe_id)]
                json_new_favourites_list = json.dumps(new_favourites_list)
                await db.execute('INSERT INTO favourites VALUES (?,?)', (username, json_new_favourites_list))
                await db.commit()
                return {'success': True, 'current_favourites': json_new_favourites_list}
        except aiosqlite.Error as e:
            print(f'Database error occured when trying to add recipe to {username}\'s favourites - {e}')
            raise HTTPException(status_code=500, detail='Database error adding recipe to favourites')
        except Exception as ex:
            print(f'Non-database error occured when trying to add recipe to {username}\'s favourites - {ex}')
            raise HTTPException(status_code=500, detail='Non-database related error adding recipe to favourites')
        
@app.post('/api/removeFromFavourites')
async def remove_from_favourites(username_and_recipe_id_to_unfavourite: UsernameAndIDToUnfavourite):
    async with aiosqlite.connect('favourites.db') as db:
        await db.execute("CREATE TABLE IF NOT EXISTS favourites (username TEXT PRIMARY KEY, ids TEXT NOT NULL DEFAULT '[]')")
        await db.commit()
        username = username_and_recipe_id_to_unfavourite.username
        recipe_id = username_and_recipe_id_to_unfavourite.recipe_id_to_unfavourite
        cur = await db.execute('SELECT * FROM favourites WHERE username = ?', (username,))
        result = await cur.fetchone()
        if result:
            json_favourites_ids = result[1]
            favourites_ids_list = json.loads(json_favourites_ids)
            print(f'favourites_ids_list: {favourites_ids_list}')
            modified_favourites_ids_list = [value for value in favourites_ids_list if value != str(recipe_id)]
            print(f'modified_favourites_ids_list: {modified_favourites_ids_list}')
            json_favourites_ids_new = json.dumps(modified_favourites_ids_list)
            await db.execute('UPDATE favourites SET ids = ? WHERE username = ?', (json_favourites_ids_new, username))
            await db.commit()
            return {'success': True, 'current_favourites': json_favourites_ids_new}
        else:
            await db.execute('INSERT INTO favourites VALUES (?,?)', (username, '[]'))
            await db.commit()
            raise HTTPException(status_code=400, detail='Recipe not in favourites')
        
@app.post('/api/createRecipe')
async def make_recipe_submission(recipe_obj: RecipeObject):
    async with aiosqlite.connect('posts.db') as db:
        await db.execute('CREATE TABLE IF NOT EXISTS posts (username TEXT PRIMARY KEY NOT NULL, post_data TEXT NOT NULL DEFAULT \'[]\')')
        await db.commit()
        try:
            username = recipe_obj.username
            recipe_id = recipe_obj.recipe_id
            recipe_title = recipe_obj.recipe_title
            recipe_description = recipe_obj.recipe_description
            cur = await db.execute('SELECT post_data FROM posts WHERE username = ?', (username,))
            result = await cur.fetchone()
            if result:
                print(f'result', result, 'json_recipe_string')
                json_recipe_string = result[0]
                recipe_list = json.loads(json_recipe_string)
                recipe_list.append([str(recipe_id), recipe_title, recipe_description])
                print(f'recipe_list via createRecipe is now: {recipe_list}')
                json_new_recipe_list = json.dumps(recipe_list)
                print(f'json_new_recipe_list = json.dumps(recipe_list): {json_new_recipe_list}')
                await db.execute('UPDATE posts SET post_data = ? WHERE username = ?', (json_new_recipe_list, recipe_obj.username))
                await db.commit()
                return {'success': True}
            else:
                await db.execute('INSERT INTO posts VALUES (?,?)', (username, json.dumps([[str(recipe_id), recipe_title, recipe_description]])))
                await db.commit()
                return {'success': True}
        except aiosqlite.Error as e:
            print(f'aiosqlite.Error: {e}')
            raise HTTPException(status_code=500, detail=f'Error inserting recipe into the database: {e}')
        except Exception as ex:
            print(f'Exception: {ex}')
            raise HTTPException(status_code=500, detail=f'Exception occured: {ex}')
        
@app.post('/api/registerUser')
async def attempt_user_registration(user_credentials_obj: UserCredentialsObject):
    async with aiosqlite.connect('users.db') as db:
        username = user_credentials_obj.username
        password = user_credentials_obj.password
        try:
            cur = await db.execute('SELECT * FROM users WHERE username = ?', (username,))
            result = await cur.fetchone()
            if result:
                raise HTTPException(status_code=400, detail='User already registered')
            else:
                await db.execute('INSERT INTO users VALUES (?, ?)', (username, password))
                await db.commit()
                return {'success': True, 'username': username}
        except aiosqlite.Error as e:
            raise HTTPException(status_code=500, detail='Error registering user in database')
        except Exception as e:
            raise HTTPException(status_code=500, detail='Error unrelated to the database while registering user')
        