import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'
import './Home.css'

const Home: React.FC = () => {
    const [allRecipes, setAllRecipes] = useState<string[]>([]);
    const [favouriteRecipeIDs, setFavouriteRecipeIDs] = useState<string[]>([]);
    const { isLoggedIn, username } = useAuth();
    const navigator = useNavigate();

    const navigateTo = (url_segment: string) => {
        navigator(url_segment);
    }

    const retrieveAllRecipes = async () => {
        const retrieveAllRecipesAPIURL = 'https://localhost:8000/api/retrieveAllRecipes';
        const response = await fetch(retrieveAllRecipesAPIURL);
        if (!response.ok) {
            console.error('Error retrieving all recipes');
        } else {
            const data = await response.json();
            if (data.recipes) {
                const recipesData = JSON.parse(data.recipes);
                setAllRecipes(recipesData);
            }  
        }
    }

    const addToFavourites = async (recipeId: number) => {
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
                    if (data.favourite_recipe_ids) {
                        setFavouriteRecipeIDs(() => {
                            const recipeIDs = JSON.parse(data.favourite_recipe_ids);
                            return recipeIDs;
                        });
                    }
                }
            }
        }
    }

    useEffect(() => {
        getFavouriteRecipes();
    }, [])

    useEffect(() => {
        retrieveAllRecipes();
    }, [])

    useEffect(() => {
    }, [favouriteRecipeIDs])

    return (
        <>
            <NavBar />
            <div className="home-container">
                <h2 className="home-title">Welcome to my recipes sharing service!</h2>
                <h3 className="home-subtitle">See all recipes here:</h3>
                {allRecipes.length > 0 ? (
                    <div className='ul-container'>
                        <ul className='recipe-list'>
                            {allRecipes.map((recipe, index) => (
                                <li className='list-item' key={`li-${index}`}>
                                    <strong>Recipe {index + 1} {favouriteRecipeIDs.includes(recipe[0]) ? '⭐' : ''}</strong><br/>
                                    <span className="recipe-title-span">Title: {recipe[1]}</span><br/>
                                    <span className="recipe-description-span">Description: {recipe[2]}</span>
                                    <div className="actions-container">
                                        {favouriteRecipeIDs.includes(recipe[0]) ? (
                                            <button disabled={!isLoggedIn || !username} onClick={() => removeFromFavourites(recipe[0] as unknown as number)} className="remove-from-favourites-button">Remove From Favourites</button>
                                        ) : (
                                            <button disabled={!isLoggedIn || !username} onClick={() => addToFavourites(recipe[0] as unknown as number)} className="add-to-favourites-button">Add To Favourites</button>
                                        )}
                                        <button onClick={() => navigateTo(`/recipe/${recipe[0]}`)} className='view-recipe-button'>View Recipe Page</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <span className="fetching-recipes-span">No recipes found!</span>
                )}
            </div>
        </>
    )
}

export default Home