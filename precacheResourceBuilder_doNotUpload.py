import os

def list_files(startpath):
    file_paths = []
    for root, dirs, files in os.walk(startpath):
        for file in files:
            # Get the full path of the file
            full_path = os.path.join(root, file)
            # Convert to a forward-slash path (for web use)
            web_path = full_path.replace("\\", "/")
            file_paths.append(web_path)
    return file_paths

# Replace this with the path to your project folder
project_folder = "./"

# Get the list of all files
all_files = list_files(project_folder)

# Print the list in a format ready for precacheResources
print("[")
for file in all_files:
    # Remove the project folder prefix (e.g., "./") to make paths relative to the root
    relative_path = os.path.relpath(file, project_folder).replace("\\", "/")
    print(f"  '/{relative_path}',")
print("];")
