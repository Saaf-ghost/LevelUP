from typing import Literal, Optional
from pydantic import BaseModel, Field


class TaskItem(BaseModel):
    title: str = Field(..., description="Action-oriented technical task title (e.g. 'Implement JWT verification filter')")
    description: str = Field(default="", description="Technical details, acceptance criteria, or engineering notes")
    effort_points: int = Field(default=3, ge=1, le=13, description="Fibonacci story points (1, 2, 3, 5, 8, 13)")
    estimated_hours: int = Field(default=4, ge=1, description="Estimated developer hours to complete")
    priority: Literal["LOW", "MEDIUM", "HIGH", "URGENT"] = Field(default="MEDIUM")


class UserStoryItem(BaseModel):
    title: str = Field(..., description="User story title (e.g. 'As a User I want to...')")
    user_role: str = Field(default="User", description="Target persona, e.g. 'Product Owner', 'Developer'")
    action: str = Field(..., description="What the user wants to achieve")
    benefit: str = Field(..., description="Why or expected business value")
    acceptance_criteria: list[str] = Field(
        default_factory=list,
        description="Gherkin-style criteria: Given [precondition], When [action], Then [outcome]"
    )
    tasks: list[TaskItem] = Field(default_factory=list, description="List of technical subtasks implementing this story")


class RequirementItem(BaseModel):
    id: Optional[str] = Field(default=None, description="Requirement key like REQ-01")
    title: str = Field(..., description="Requirement or feature summary")
    description: str = Field(default="", description="High level requirement scope")
    category: str = Field(default="Functional", description="Functional, Non-Functional, Security, etc.")
    user_stories: list[UserStoryItem] = Field(default_factory=list, description="Stories derived from this requirement")


class BacklogDecompositionResult(BaseModel):
    document_summary: str = Field(
        default="",
        description="Executive summary of the analyzed document"
    )
    requirements: list[RequirementItem] = Field(
        default_factory=list,
        description="List of extracted requirements and their decomposed stories and tasks"
    )

