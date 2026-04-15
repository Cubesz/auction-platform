import { useState } from "react";
import { createListing } from "../api/listings";
import type { Listing, CreateListingInput } from "../types";

interface Props {
	onSuccess: (listing: Listing) => void;
}

export default function CreateListingForm({ onSuccess }: Props) {
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const data = new FormData(e.currentTarget);
		const title = (data.get("title") as string).trim();
		const description = (data.get("description") as string).trim();
		const category = (data.get("category") as string) as CreateListingInput["category"];
		const startingPrice = Number(data.get("startingPrice"));
		const imageUrl = (data.get("imageUrl") as string).trim();
		const rawEndsAt = (data.get("endsAt") as string).trim();

		if (!title) {
			setError("Title is required.");
			return;
		}
		if (!description) {
			setError("Description is required.");
			return;
		}
		if (!category) {
			setError("Category is required.");
			return;
		}
		if (!startingPrice || isNaN(startingPrice) || startingPrice < 0) {
			setError("Starting price must be a non-negative number.");
			return;
		}
		if (!rawEndsAt) {
			setError("End date/time is required.");
			return;
		}

		// Convert local datetime to strict UTC ISO string
		const endsAt = new Date(rawEndsAt).toISOString();

		setSubmitting(true);
		try {
			const listing = await createListing({
				title,
				description,
				category,
				startingPrice,
				imageUrl,
				endsAt,
			});
			onSuccess(listing);
			e.currentTarget.reset();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create listing");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form className="bid-form" onSubmit={handleSubmit} noValidate>
			<h4 className="bid-form__title">New Listing</h4>
			{error && <div className="bid-form__error">{error}</div>}
			<div className="bid-form__field">
				<label htmlFor="title">Title</label>
				<input
					id="title"
					name="title"
					type="text"
					placeholder="e.g. 2018 John Deere 6120M"
					disabled={submitting}
				/>
			</div>
			<div className="bid-form__field">
				<label htmlFor="description">Description</label>
				<textarea
					id="description"
					name="description"
					placeholder="Describe the equipment"
					disabled={submitting}
				/>
			</div>
			<div className="bid-form__field">
				<label htmlFor="category">Category</label>
				<select id="category" name="category" disabled={submitting}>
					<option value="">Select category</option>
					<option value="tractor">Tractor</option>
					<option value="combine">Combine</option>
					<option value="implement">Implement</option>
					<option value="attachment">Attachment</option>
				</select>
			</div>
			<div className="bid-form__field">
				<label htmlFor="startingPrice">Starting Price ($)</label>
				<input
					id="startingPrice"
					name="startingPrice"
					type="number"
					min="0"
					step="0.01"
					placeholder="0.00"
					disabled={submitting}
				/>
			</div>
			<div className="bid-form__field">
				<label htmlFor="imageUrl">Image URL</label>
				<input
					id="imageUrl"
					name="imageUrl"
					type="url"
					placeholder="https://..."
					disabled={submitting}
				/>
			</div>
			<div className="bid-form__field">
				<label htmlFor="endsAt">End Date/Time</label>
				<input
					id="endsAt"
					name="endsAt"
					type="datetime-local"
					disabled={submitting}
				/>
			</div>
			<button
				type="submit"
				className="bid-form__submit"
				disabled={submitting}
			>
				{submitting ? "Creating…" : "Create Listing"}
			</button>
		</form>
	);
}
