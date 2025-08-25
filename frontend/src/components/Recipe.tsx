import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './Recipe.css'
import NavBar from './NavBar.tsx'

const Recipe: React.FC = () => {
    const [recipeData, setRecipeData] = useState<string[]>([]);
    const { recipeId } = useParams<{recipeId: string}>();
    const getRecipeInformation = async (recipeId: string) => {
        const getRecipeInformationAPIURL = `https://localhost:8000/api/getRecipeInformation/${recipeId}`;
        const response = await fetch(getRecipeInformationAPIURL);
        const data = await response.json();
        if (data.success) {
            setRecipeData(() => {
                const dataObject: string[] = JSON.parse(data.recipe_data);
                console.log('dataObject:', dataObject);
                return dataObject;
            })
        }
    }  
    useEffect(() => {
        if (recipeId) {
            getRecipeInformation(recipeId);
        }
    }, [])
    return (
        <>
            <NavBar />
            <div className="recipe-container">
                <div className="recipe-title-and-id">
                    <strong className="recipe-title">{recipeData[1]}</strong>
                    <strong className="recipe-id">{recipeData[0]}</strong>
                </div>
                <div className="recipe-description">
                    <span className="recipe-description-span">
                        {recipeData[2]}
                    </span>
                </div>
                {/* Add comments functionality here */}
            </div>
        </>
    )
}

export default Recipe