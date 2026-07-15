import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import DeleteProductCommand from "./delete-product.command";
import { ProductRepository } from "src/infrastructure/repository/product.repository";
import { BadRequestException, ForbiddenException } from "@nestjs/common";

@CommandHandler(DeleteProductCommand)
export default class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
    constructor(
        private readonly repository: ProductRepository,
    ) { }

    async execute(command: DeleteProductCommand): Promise<unknown> {
        const product_uuid = command.product_uuid;
        const user_uuid = command.user_uuid;

        // check product existance
        const isProductExists = await this.repository.findOneByClause({
            uuid: product_uuid
        });
        if (!isProductExists) {
            throw new BadRequestException("Product Not Found");
        }

        // Check if the user is the owner
        if (isProductExists.user_uuid !== user_uuid) {
            throw new ForbiddenException("You are not authorized to delete this product");
        }

        // delete product
        await this.repository.deleteProduct(product_uuid);
        return;
    }
}
