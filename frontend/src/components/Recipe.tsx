import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import './Recipe.css'
import NavBar from './NavBar.tsx'

const Recipe: React.FC = () => {
    const [recipeData, setRecipeData] = useState<string[]>([]);
    const [recipeComments, setRecipeComments] = useState<string[]>([]);
    const [userComment, setUserComment] = useState<string>('');
    const { recipeId } = useParams<{recipeId: string}>();
    const { isLoggedIn, username } = useAuth();
    const navigator = useNavigate();
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
    const getRecipeComments = async (recipeId: string) => {
        const getRecipeCommentsAPIURL = `https://localhost:8000/api/getRecipeComments/${recipeId}`;
        const response = await fetch(getRecipeCommentsAPIURL)
        const data = await response.json()
        if (data.success) {
            const recipeCommentsArray = JSON.parse(data.recipe_comments)
            console.log('recipeCommentsArray:', recipeCommentsArray);
            setRecipeComments(() => recipeCommentsArray);
        }
    }
    const submitComment = async (recipe_id: string, comment: string) => {
        const comment_id = Date.now();
        const submitCommentAPIURL = 'https://localhost:8000/api/submitComment';
        const response = await fetch(submitCommentAPIURL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: username, recipe_id: String(recipe_id), recipe_comment: comment, comment_id: String(comment_id)})
        });
        if (!response.ok) {
            console.error('Error submitting comment');
        } else {
            const data = await response.json();
            if (data.success && recipeId) {
                getRecipeComments(recipeId);
            }
        }
    }
    const deleteComment = async (commentId: string) => {
        const deleteCommentAPIURL = 'https://localhost:8000/api/deleteComment';
        const response = await fetch(deleteCommentAPIURL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: username, recipe_id: recipeId, comment_id: commentId})
        })
        if (!response.ok) {
            console.error('Error deleting comment');
        } else {
            const data = await response.json();
            if (data.success) {
                console.log('Successfully removed comment');
                if (recipeId) {
                    getRecipeComments(recipeId);
                }
            }
        }
    }
    useEffect(() => {
        if (recipeId) {
            getRecipeInformation(recipeId);
            getRecipeComments(recipeId);
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
                {(recipeComments.length > 0) ? (
                    <div className="recipe-comments-container">
                        {recipeComments.map((comment, index) => (
                                <div key={`recipe-comment-container-${index}`} className="recipe-comment-container">
                                    <span className="comment-span">Comment {index+1}:</span>
                                    <span className="comment-author">Author: {comment[0]}</span>
                                    <span className="comment-content">Content: {comment[1]}</span>
                                    {isLoggedIn && username && username === comment[0] && (
                                        <button onClick={() => isLoggedIn && username && deleteComment(comment[2])} className="delete-comment-button">Delete Comment</button>
                                    )}
                                </div>
                            ))
                        }
                    </div>
                ) : (
                    <div className="no-comments-container">
                        <strong className="no-comments-title">No comments! Why not be the first to comment?</strong>
                    </div>
                )}
                {isLoggedIn && username && (
                    <div className="submit-comment-container">
                        <label className="enter-comment-label">Enter Comment:</label>
                        <input value={userComment} onChange={e => setUserComment(e.target.value)} type="text" className="comment-input" />
                        <button onClick={() => recipeId && userComment && submitComment(recipeId, userComment)} className="submit-comment-button">Submit</button>
                    </div>
                )}
            </div>
        </>
    )
}

export default Recipe