import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './UserProfile.css'
import NavBar from './NavBar'

const UserProfile: React.FC = () => {

    const { urlProvidedUsername } = useParams<{ urlProvidedUsername: string }>();
    const [userRecipes, setUserRecipes] = useState<string[][]>([[]]);
    const [userProvidedRecipeTitle, setUserProvidedRecipeTitle] = useState<string>();
    const [userProvidedRecipeDescription, setUserProvidedRecipeDescription] = useState<string>('');
    const [favouriteRecipeIDs, setFavouriteRecipeIDs] = useState<string[]>([]);

    const {isLoggedIn, username} = useAuth();

    const submitRecipe = async (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        if (isLoggedIn) {
            const recipeSubmissionAPIURL = 'https://localhost:8000/api/createRecipe';
            const recipeId = Date.now();
            const response = await fetch(recipeSubmissionAPIURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username, recipe_id: recipeId, recipe_title: userProvidedRecipeTitle, recipe_description: userProvidedRecipeDescription })
            });
            if (!response.ok) {
                console.error('Error submiting recipe to the database');
            } else {
                const data = await response.json();
                if (data.success) {
                    console.log('Recipe successfully submitted to the database');
                }
            }
            setUserProvidedRecipeTitle('');
            setUserProvidedRecipeDescription('');
        }
    }

    const fetchUserRecipes = async () => {
        const response = await fetch(`https://localhost:8000/api/${urlProvidedUsername}/recipes`);
        if (!response.ok) {
            console.log('Error fetching recipes by provided username');
        } else {
            const data = await response.json();
            console.log('Data fetched by request for username', urlProvidedUsername, 'is:', data);
            if (data.recipesString) {
                const recipesArray = JSON.parse(data.recipesString);
                console.log('recipesArray', recipesArray);
                setUserRecipes(recipesArray);
            }
        }
    }

    const addToFavourites = async (recipeId: number) => {
        console.log('Called addToFavourites with value', recipeId);
        if (isLoggedIn && username) {
            const addToFavouritesAPIURL = 'https://localhost:8000/api/addToFavourites';
            const response = await fetch(addToFavouritesAPIURL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username: username, recipe_id_to_favourite: recipeId})
            })
            if (!response.ok) {
                console.error('Error adding recipe to favourites');
            } else {
                const data = await response.json();
                if (data.success) {
                    console.log('Successfully added recipe to favourites');
                    if (data.current_favourites) {
                        setFavouriteRecipeIDs(() => {
                            const current_favourites_array = JSON.parse(data.current_favourites);
                            return current_favourites_array;
                        })
                    }
                }
            }
        }
    }

    const removeFromFavourites = async (recipeId: number) => {
        console.log('Called removeFromFavourites with value', recipeId);
        if (isLoggedIn && username) {
            const removeFromFavouritesAPIURL = 'https://localhost:8000/api/removeFromFavourites';
            const response = await fetch(removeFromFavouritesAPIURL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username: username, recipe_id_to_unfavourite: recipeId})
            });
            if (!response.ok) {
                console.error('Error removing recipe from favourites');
            } else {
                const data = await response.json();
                if (data.success) {
                    console.log('Succesfully removed recipe from favourites');
                    if (data.current_favourites) {
                        setFavouriteRecipeIDs(() => {
                            const current_favourites_array = JSON.parse(data.current_favourites);
                            return current_favourites_array;
                        })
                    }
                }
            }
        }
    }

    const getFavouriteRecipes = async () => {
        if (isLoggedIn && username) {
            const getFavouriteRecipesAPIURL = 'https://localhost:8000/api/getFavouriteRecipes';
            const response = await fetch(getFavouriteRecipesAPIURL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username: username})
            });
            if (!response.ok) {
                console.error('Error getting favourite recipes');
            } else {
                const data = await response.json();
                if (data.success) {
                    console.log('data.success', data.success);
                    if (data.favourite_recipe_ids) {
                        console.log('data.favourite_recipe_ids', data.favourite_recipe_ids);
                        setFavouriteRecipeIDs(() => {
                            const recipeIDs = JSON.parse(data.favourite_recipe_ids);
                            return recipeIDs;
                        });
                        console.log('favouriteRecipeIDs', favouriteRecipeIDs);
                    }
                }
            }
        }
    }

    const deleteRecipe = async (user: string, recipeId: string) => {
        if (isLoggedIn && username) {
            const deleteRecipeAPIURL = 'https://localhost:8000/api/deleteRecipe';
            const response = await fetch(deleteRecipeAPIURL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username: user, recipe_id: recipeId})
            });
            if (!response.ok) {
                console.error('Error deleting recipe from database');
            } else {
                const data = await response.json();
                if (data.success) {
                    console.log('Success removing recipe from database');
                    await fetchUserRecipes();
                }
            }
        }
    }

    useEffect(() => {
        getFavouriteRecipes();
    }, [])

    useEffect(() => {
        if (isLoggedIn && username) {
            console.log('favouriteRecipeIDs is now:', favouriteRecipeIDs);
        }
    }, [favouriteRecipeIDs])

    useEffect(() => {
        fetchUserRecipes();
    }, [userProvidedRecipeTitle, userProvidedRecipeDescription])

    return (
        <>
            <NavBar />
            <div className="user-profile-container">
                <h2 className="user-recipes-title">Recipes by {urlProvidedUsername}</h2>
                {isLoggedIn && username === urlProvidedUsername && (
                    <div className="recipe-submission-container">
                        <form className="recipe-submission-form">
                            <div className="recipe-title-container">
                                <label className="recipe-title-label">
                                    Recipe Title:
                                </label>
                                <input disabled={!isLoggedIn || username !== urlProvidedUsername} onChange={e => setUserProvidedRecipeTitle(e.target.value)} placeholder='Enter recipe title here' type="text" className="recipe-title-input" />
                            </div>
                            <div className="recipe-title-description">
                                <label className="recipe-title-label">
                                    Recipe Description:
                                </label>
                                <input disabled={!isLoggedIn || username !== urlProvidedUsername} onChange={e => setUserProvidedRecipeDescription(e.target.value)} placeholder='Enter recipe description here' type="text" className="recipe-description-input" />
                            </div>
                            <div className="submit-button-container">
                                <button disabled={!isLoggedIn || username !== urlProvidedUsername} onClick={e => submitRecipe(e)} className="submit-recipe-button">Submit</button>
                            </div>
                        </form>
                    </div>
                )}
                <ul className="list-of-recipes">
                    <div className="container-for-React-mapped-recipes">
                        {userRecipes.map((recipe, index) => (
                            <div key={`recipes-container-div-${index}`} className="recipe-list-item-container">
                                <li className="recipe-list-item">
                                    <div className="recipe-information-container">
                                        <strong>Recipe {index + 1} {favouriteRecipeIDs.includes(recipe[0]) ? '⭐' : ''}</strong><br/>
                                        <span className="recipe-id-span">ID: {recipe[0]}</span><br/>
                                        <span className="recipe-title-span">Title: {recipe[1]}</span><br/>
                                        <span className="recipe-description-span">Description: {recipe[2]}</span>
                                        {favouriteRecipeIDs.includes(recipe[0]) ? (
                                            <button disabled={!isLoggedIn || !username} onClick={() => removeFromFavourites(recipe[0] as unknown as number)} className="remove-from-favourites-button">Remove From Favourites❔</button>
                                        ) : (
                                            <button disabled={!isLoggedIn || !username} onClick={() => addToFavourites(recipe[0] as unknown as number)} className="add-to-favourites-button">Add To Favourites❔</button>
                                        )}
                                        {(isLoggedIn && username && username === urlProvidedUsername) && (<button onClick={() => deleteRecipe(username, recipe[0])} className='delete-recipe-button'>Delete Recipe</button>)}
                                    </div>
                                </li>
                            </div>
                        ))}
                    </div>
                </ul>
            </div>
        </>
        
    )
}

export default UserProfile